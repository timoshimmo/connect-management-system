const asyncHandler = require('../../utils/asyncHandler');
const microsoftService = require('./microsoft.service');
const { setRefreshCookie } = require('./auth.controller');
const env = require('../../config/env');

const OAUTH_COOKIE_NAME = 'ms_oauth';
const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/microsoft',
  maxAge: 10 * 60 * 1000,
};

function setOAuthCookie(res, value) {
  res.cookie(OAUTH_COOKIE_NAME, value, OAUTH_COOKIE_OPTIONS);
}

function clearOAuthCookie(res) {
  res.clearCookie(OAUTH_COOKIE_NAME, { path: '/api/auth/microsoft' });
}

const enabled = asyncHandler(async (req, res) => {
  res.json({ enabled: microsoftService.isEnabled() });
});

/** Unauthenticated "Sign in with Microsoft" — the browser navigates here directly, so this responds with a real 302, not JSON. */
const start = asyncHandler(async (req, res) => {
  const { url, cookieValue } = await microsoftService.getAuthorizationUrl();
  setOAuthCookie(res, cookieValue);
  res.redirect(url);
});

/**
 * Authenticated "Connect Microsoft" from the Profile page. A plain browser
 * navigation can't carry the app's Bearer access token, so this returns the
 * Microsoft URL as JSON (called via the normal authenticated apiRequest)
 * and the frontend does the actual `window.location.href` navigation —
 * the Set-Cookie on this response still lands in the browser's cookie jar
 * exactly as if it came from a redirect.
 */
const linkStart = asyncHandler(async (req, res) => {
  const { url, cookieValue } = await microsoftService.getAuthorizationUrl({ linkUserId: req.user.id });
  setOAuthCookie(res, cookieValue);
  res.json({ url });
});

const callback = asyncHandler(async (req, res) => {
  try {
    const { accessToken, refreshToken } = await microsoftService.handleCallback({
      query: req.query,
      cookieValue: req.cookies?.[OAUTH_COOKIE_NAME],
    });
    clearOAuthCookie(res);
    setRefreshCookie(res, refreshToken);
    // The frontend's SessionBootstrap already silently calls /auth/refresh
    // on every page load — landing here is all that's needed to pick up
    // the session; the access token itself doesn't need to travel via URL.
    void accessToken;
    res.redirect(`${env.frontendUrl}/ms-publishing`);
  } catch (err) {
    clearOAuthCookie(res);
    const code = err.code || 'unknown';
    res.redirect(`${env.frontendUrl}/login?ssoError=${encodeURIComponent(code)}`);
  }
});

const unlink = asyncHandler(async (req, res) => {
  const user = await microsoftService.unlink(req.user.id);
  res.json({ user });
});

module.exports = { enabled, start, linkStart, callback, unlink };
