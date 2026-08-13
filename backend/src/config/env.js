require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

const nodeEnv = required('NODE_ENV', 'development');
const jwtAccessSecret = required('JWT_ACCESS_SECRET', 'dev-access-secret');
const jwtRefreshSecret = required('JWT_REFRESH_SECRET', 'dev-refresh-secret');

// The dev fallback secrets above are fine for local work, but silently
// accepting them in production would mean every JWT this server issues is
// forgeable by anyone who's read this file — fail loudly at startup
// instead of ever running with a well-known signing secret.
if (nodeEnv === 'production') {
  const insecure = [];
  if (jwtAccessSecret === 'dev-access-secret') insecure.push('JWT_ACCESS_SECRET');
  if (jwtRefreshSecret === 'dev-refresh-secret') insecure.push('JWT_REFRESH_SECRET');
  if (insecure.length > 0) {
    throw new Error(
      `Refusing to start with NODE_ENV=production while using insecure default value(s) for: ${insecure.join(', ')}. Set real secrets in the environment.`
    );
  }
}

module.exports = {
  nodeEnv,
  port: Number(required('PORT', 5000)),
  frontendUrl: required('FRONTEND_URL', 'http://localhost:5173'),
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/management_app'),
  jwt: {
    accessSecret: jwtAccessSecret,
    refreshSecret: jwtRefreshSecret,
    accessExpiresIn: required('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '30d'),
  },
  r2: {
    accountId: required('R2_ACCOUNT_ID', ''),
    accessKeyId: required('R2_ACCESS_KEY_ID', ''),
    secretAccessKey: required('R2_SECRET_ACCESS_KEY', ''),
    bucketName: required('R2_BUCKET_NAME', ''),
    publicBaseUrl: required('R2_PUBLIC_BASE_URL', ''),
  },
  smtp: {
    host: required('SMTP_HOST', ''),
    port: Number(required('SMTP_PORT', 465)),
    secure: required('SMTP_SECURE', 'true') === 'true',
    user: required('SMTP_USER', ''),
    pass: required('SMTP_PASS', ''),
    fromAddress: required('SMTP_FROM', ''),
  },
  microsoft: (() => {
    const tenantId = required('MICROSOFT_TENANT_ID', '');
    const clientId = required('MICROSOFT_CLIENT_ID', '');
    const clientSecret = required('MICROSOFT_CLIENT_SECRET', '');
    // Same "unconfigured = disabled, not a crash" convention as smtp/r2
    // above (see mailer.js's getTransporter()) — Microsoft SSO is optional;
    // leaving these blank just hides the "Sign in with Microsoft" button
    // and 503s the SSO routes instead of failing to start.
    return {
      tenantId,
      clientId,
      clientSecret,
      redirectUri: required('MICROSOFT_REDIRECT_URI', `http://localhost:${required('PORT', 5000)}/api/auth/microsoft/callback`),
      enabled: Boolean(tenantId && clientId && clientSecret),
    };
  })(),
};
