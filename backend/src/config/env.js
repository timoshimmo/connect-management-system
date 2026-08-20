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
  frontendUrl: required('FRONTEND_URL', 'https://management.stacmarine.com'),
  mongodbUri: required('MONGODB_URI', 'mongodb+srv://bolajistephen72_db_user:NJZWSFwXso2ic8nM@management.u3zxlwl.mongodb.net/management_app?retryWrites=true&w=majority&appName=management'),
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
    host: required('SMTP_HOST', 'smtp.zoho.com'),
    port: Number(required('SMTP_PORT', 465)),
    secure: required('SMTP_SECURE', 'true') === 'true',
    user: required('SMTP_USER', 'noreply.stacacademy@stacmarine.com'),
    pass: required('SMTP_PASS', 'gtW3A7zRkApd'),
    fromAddress: required('SMTP_FROM', 'noreply.stacacademy@stacmarine.com'),
  },

  microsoft: (() => {
    const tenantId = required('MICROSOFT_TENANT_ID', 'f6e07a26-1f87-4350-8703-9d891f3a7bf1');
    const clientId = required('MICROSOFT_CLIENT_ID', 'cded3be1-6cb3-495c-8799-5c45a15cc7e4');
    const clientSecret = required('MICROSOFT_CLIENT_SECRET', 'oc-8Q~9DXVUW6IQyB5TQRJHMisUVxKtKx.K7qb4I');
    // Same "unconfigured = disabled, not a crash" convention as smtp/r2
    // above (see mailer.js's getTransporter()) — Microsoft SSO is optional;
    // leaving these blank just hides the "Sign in with Microsoft" button
    // and 503s the SSO routes instead of failing to start.
    return {
      tenantId,
      clientId,
      clientSecret,
      redirectUri: required('MICROSOFT_REDIRECT_URI', `https://management.stacmarine.com/api/auth/microsoft/callback`),
      enabled: Boolean(tenantId && clientId && clientSecret),
    };
  })(),
};

