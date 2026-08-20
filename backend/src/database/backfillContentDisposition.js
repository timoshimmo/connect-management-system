/* eslint-disable no-console */
// One-off backfill: sets the correct Content-Disposition metadata on every
// existing R2 object under the opaque "documents/uploads/{uuid}.{ext}" key
// scheme (introduced by the presigned-upload migration) — objects uploaded
// before this fix has no Content-Disposition at all, so the public delivery
// URL (a different origin from the app) served them with no filename hint,
// and browsers deliberately ignore a client-side `download` attribute for
// cross-origin links. New uploads set this correctly at PUT time (see
// middlewares/upload.js's createPresignedUploadUrl) — this script only
// repairs objects that predate that fix.
//
// Uses S3's CopyObject-to-self trick (MetadataDirective: REPLACE) to update
// metadata in place without re-uploading any file bytes. Safe to re-run —
// objects already carrying the correct Content-Disposition are skipped.
//
// Usage: node src/database/backfillContentDisposition.js
require('dotenv').config();
const mongoose = require('mongoose');
const contentDisposition = require('content-disposition');
const { CopyObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const env = require('../config/env');
const { r2Client } = require('../config/r2');
const { DocumentVersion } = require('../modules/documents/documentVersion.model');

const UPLOADS_KEY_PREFIX = 'documents/uploads/';

async function backfill() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to', env.mongodbUri);

  const versions = await DocumentVersion.find({
    'file.key': { $regex: `^${UPLOADS_KEY_PREFIX}` },
  }).sort({ uploadedAt: 1 });

  if (versions.length === 0) {
    console.log('Nothing to backfill — no versions use the presigned-upload key scheme yet.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Checking ${versions.length} version(s) under ${UPLOADS_KEY_PREFIX}...`);
  let fixed = 0;
  let alreadyOk = 0;
  let failed = 0;

  for (const version of versions) {
    const { key, originalFilename, mimeType } = version.file;
    const desired = contentDisposition.create(originalFilename);
    try {
      const head = await r2Client.send(new HeadObjectCommand({ Bucket: env.r2.bucketName, Key: key }));
      if (head.ContentDisposition === desired) {
        alreadyOk += 1;
        continue;
      }
      await r2Client.send(
        new CopyObjectCommand({
          Bucket: env.r2.bucketName,
          CopySource: `${env.r2.bucketName}/${key}`,
          Key: key,
          MetadataDirective: 'REPLACE',
          ContentType: mimeType,
          ContentDisposition: desired,
        })
      );
      fixed += 1;
      console.log(`  fixed: ${key} -> ${desired}`);
    } catch (err) {
      failed += 1;
      console.error(`  FAILED: ${key} (${originalFilename}): ${err.message}`);
    }
  }

  console.log(`Backfill complete. Fixed: ${fixed}, already correct: ${alreadyOk}, failed: ${failed}.`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
