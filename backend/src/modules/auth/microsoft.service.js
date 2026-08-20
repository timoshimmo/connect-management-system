const crypto = require('crypto');
const { Issuer, generators } = require('openid-client');
const { User } = require('../users/user.model');
const { RefreshToken } = require('./refreshToken.model');
const { hashToken, issueTokens } = require('./auth.service');
const { UnauthorizedError, BadRequestError, ForbiddenError, ConflictError } = require('../../common/errors');
const { recordAudit } = require('../auditLogs/auditLog.service');
const { notifyUser, notifyRole } = require('../notifications/notification.service');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // matches auth.service.js's login()/refresh()
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the Microsoft redirect round trip

/**
 * Attaches a short machine-readable `.code` to an AppError, alongside the
 * normal human-readable `.message` — the JSON error path (unlink()) shows
 * `.message` directly like every other route, while the OAuth callback
 * (which redirects rather than returning JSON) reads `.code` to build
 * `?ssoError=<code>` without ever leaking raw error text to the browser.
 */
function ssoError(ErrorClass, code, message) {
  const err = new ErrorClass(message);
  err.code = code;
  return err;
}

function isEnabled() {
  return env.microsoft.enabled;
}

let clientPromise = null;

/** Discovers the tenant's OIDC configuration once and reuses the client — same pattern as any other long-lived SDK client in this codebase (e.g. the R2 S3Client). */
function getClient() {
  if (!isEnabled()) {
    throw ssoError(BadRequestError, 'config_error', 'Microsoft SSO is not configured.');
  }
  if (!clientPromise) {
    clientPromise = Issuer.discover(`https://login.microsoftonline.com/${env.microsoft.tenantId}/v2.0`).then(
      (issuer) =>
        new issuer.Client({
          client_id: env.microsoft.clientId,
          client_secret: env.microsoft.clientSecret,
          redirect_uris: [env.microsoft.redirectUri],
          response_types: ['code'],
        })
    );
  }
  return clientPromise;
}

/**
 * Signs the OAuth state/PKCE payload into the cookie value so it can't be
 * tampered with client-side (e.g. to swap in a different `linkUserId` and
 * hijack someone else's account link) — a lightweight HMAC rather than
 * pulling in cookie-parser's signed-cookie support, since this is the only
 * place in the app that needs it.
 */
function signState(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', env.jwt.accessSecret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyState(cookieValue) {
  if (!cookieValue || typeof cookieValue !== 'string') return null;
  const [encoded, sig] = cookieValue.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', env.jwt.accessSecret).update(encoded).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (Date.now() - payload.createdAt > OAUTH_STATE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * `linkUserId` is only ever set when an *already-authenticated* user clicks
 * "Connect Microsoft" on their profile — that's the verified linking path
 * from spec §5. A fresh, unauthenticated "Sign in with Microsoft" click
 * omits it entirely.
 */
async function getAuthorizationUrl({ linkUserId } = {}) {
  const client = await getClient();
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = generators.nonce();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);

  const url = client.authorizationUrl({
    scope: 'openid profile email',
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const cookieValue = signState({
    state,
    nonce,
    codeVerifier,
    linkUserId: linkUserId || null,
    createdAt: Date.now(),
  });

  return { url, cookieValue };
}

async function handleCallback({ query, cookieValue }) {
  const stored = verifyState(cookieValue);
  if (!stored) {
    logger.warn({ hasCookie: Boolean(cookieValue) }, 'Microsoft SSO: state cookie missing or invalid/expired');
    throw ssoError(UnauthorizedError, 'unknown', 'This sign-in attempt expired. Please try again.');
  }
  if (query.error) {
    // The user cancelled/denied consent on Microsoft's own screen.
    throw ssoError(UnauthorizedError, 'cancelled', 'Microsoft sign-in was cancelled.');
  }

  const client = await getClient();
  let tokenSet;
  try {
    // client.callback() already normalizes a plain params object internally
    // (via its own pickCb()) — no need for callbackParams(), which requires
    // a real http.IncomingMessage-like object (.url + .method) and throws a
    // TypeError on a plain { query, method } shape. req.query is already
    // the right shape on its own.
    tokenSet = await client.callback(env.microsoft.redirectUri, query, {
      state: stored.state,
      nonce: stored.nonce,
      code_verifier: stored.codeVerifier,
    });
  } catch (err) {
    // Logged (never shown to the browser) so the real Microsoft/openid-client
    // error is visible in server logs instead of only a generic toast.
    logger.error({ err, redirectUri: env.microsoft.redirectUri }, 'Microsoft SSO: token exchange failed');
    throw ssoError(UnauthorizedError, 'unknown', 'Microsoft sign-in could not be completed. Please try again.');
  }

  return resolveAndSignIn({ claims: tokenSet.claims(), linkUserId: stored.linkUserId });
}

/**
 * Everything after "we have a validated id_token's claims" — resolving to
 * an existing/linked/new User, the Inactive check, and token issuance.
 * Split out from handleCallback() so this business logic (the part the
 * spec's 12 test scenarios actually care about) can be exercised directly
 * with fabricated claims, independent of a live Microsoft redirect.
 */
async function resolveAndSignIn({ claims, linkUserId }) {
  const oid = claims.oid || claims.sub;
  const tid = claims.tid;
  const email = (claims.email || claims.preferred_username || '').toLowerCase();
  const name = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || email;

  if (!oid || !tid || !email) {
    throw ssoError(
      BadRequestError,
      'config_error',
      'Microsoft did not return the profile information this app requires (id, tenant, and email). Check the app registration’s requested claims.'
    );
  }
  if (env.microsoft.tenantId !== 'common' && tid !== env.microsoft.tenantId) {
    throw ssoError(ForbiddenError, 'unauthorized_tenant', 'This Microsoft account belongs to a different organization and cannot sign in here.');
  }

  let user;
  let event; // 'signup' | 'link' | 'login'

  if (linkUserId) {
    const conflicting = await User.findOne({ microsoftId: oid });
    if (conflicting && conflicting._id.toString() !== linkUserId) {
      throw ssoError(ConflictError, 'link_conflict', 'This Microsoft account is already linked to a different STAC Management System user.');
    }
    user = await User.findById(linkUserId).populate('department', 'name code');
    if (!user) throw ssoError(UnauthorizedError, 'unknown', 'Your session is no longer valid. Please sign in again.');
    if (!user.microsoftId) {
      user.microsoftId = oid;
      user.microsoftTenantId = tid;
      user.microsoftLinkedAt = new Date();
      await user.save();
      event = 'link';
    } else {
      event = 'login'; // re-linking the same identity — treat as a normal sign-in
    }
  } else {
    user = await User.findOne({ microsoftId: oid }).populate('department', 'name code');
    if (!user) {
      user = await User.findOne({ email }).populate('department', 'name code');
      if (user) {
        if (user.microsoftId && user.microsoftId !== oid) {
          throw ssoError(ConflictError, 'link_conflict', 'This account is already linked to a different Microsoft identity.');
        }
        user.microsoftId = oid;
        user.microsoftTenantId = tid;
        user.microsoftLinkedAt = new Date();
        await user.save();
        event = 'link';
      } else {
        // First-time SSO signup — role/department are deliberately left
        // unset (spec: never assume application-specific data from an
        // identity provider). A Controller assigns them from User
        // Management, exactly like a manually-created account.
        user = await User.create({
          name,
          email,
          passwordHash: null,
          role: null,
          department: null,
          status: 'Active',
          microsoftId: oid,
          microsoftTenantId: tid,
          microsoftLinkedAt: new Date(),
        });
        event = 'signup';
      }
    } else {
      event = 'login';
    }
  }

  if (user.status === 'Inactive') {
    throw ssoError(UnauthorizedError, 'inactive', 'This account has been deactivated. Contact your Document Controller.');
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  if (event === 'signup') {
    await recordAudit({ user: user._id, action: 'sso_signup', targetType: 'auth', metadata: { email } });
    await notifyUser(user._id, {
      type: 'sso_account_created',
      message: 'Your STAC Management System account was created via Microsoft sign-in. A Document Controller will assign your role and department shortly.',
    });
    await notifyRole('controller', {
      type: 'user_created',
      message: `${user.name} signed in with Microsoft for the first time and needs a role and department assigned.`,
    });
  } else if (event === 'link') {
    await recordAudit({ user: user._id, action: 'sso_link', targetType: 'auth', metadata: { email } });
    await notifyUser(user._id, {
      type: 'sso_linked',
      message: 'Your Microsoft account has been linked. You can now sign in with either Microsoft or your password.',
    });
  }
  await recordAudit({ user: user._id, action: 'sso_login', targetType: 'auth', metadata: { email } });

  return { accessToken, refreshToken, user: user.toPublicJSON() };
}

/** Disconnecting is refused when it's the account's only auth method — spec §11/§16 — so nobody can lock themselves out. */
async function unlink(userId) {
  const user = await User.findById(userId).populate('department', 'name code');
  if (!user) throw new UnauthorizedError('User not found.');
  if (!user.microsoftId) throw new BadRequestError('No Microsoft account is linked.');
  if (!user.passwordHash) {
    throw new BadRequestError('Set a password first — disconnecting Microsoft now would lock you out of your account.');
  }

  // Unset (not null) — see user.model.js's comment on the sparse unique
  // index: an explicit `null` would still occupy a slot in it and collide
  // with the next user who unlinks or never links at all.
  user.microsoftId = undefined;
  user.microsoftTenantId = null;
  user.microsoftLinkedAt = null;
  await user.save();

  await recordAudit({ user: user._id, action: 'sso_unlink', targetType: 'auth' });
  await notifyUser(user._id, {
    type: 'sso_unlinked',
    message: 'Your Microsoft account has been disconnected. You can still sign in with your password.',
  });

  return user.toPublicJSON();
}

module.exports = { isEnabled, getAuthorizationUrl, handleCallback, unlink, resolveAndSignIn };
