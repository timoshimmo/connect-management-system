require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  return value;
}

module.exports = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 5000)),
  frontendUrl: required('FRONTEND_URL', 'http://localhost:5173'),
  mongodbUri: required('MONGODB_URI', 'mongodb+srv://bolajistephen72_db_user:NJZWSFwXso2ic8nM@management.u3zxlwl.mongodb.net/management_app?retryWrites=true&w=majority&appName=management'),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
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
};