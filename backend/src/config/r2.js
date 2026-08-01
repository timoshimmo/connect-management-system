const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

/**
 * Cloudflare R2 is S3-compatible, so the AWS SDK v3's S3Client talks to it
 * directly — just point `endpoint` at the account's R2 endpoint and use
 * region 'auto' (R2 ignores AWS regions).
 */
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
});

/**
 * Builds the public delivery URL for an object key. Requires the bucket's
 * public access to be enabled (R2 dashboard → bucket → Settings → Public
 * access — either the free r2.dev subdomain or a connected custom domain)
 * and `R2_PUBLIC_BASE_URL` set to that base URL — the same "plain public
 * URL" delivery model the app previously used with Cloudinary.
 */
function buildPublicUrl(key) {
  return `${env.r2.publicBaseUrl}/${key}`;
}

module.exports = { r2Client, buildPublicUrl };
