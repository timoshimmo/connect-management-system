/* eslint-disable no-console */
// One-off, additive-only backfill: assigns documentRegisterReference
// (STAC-QHSE-[TYPE]-[NNN]) to any existing Document Register document that
// doesn't have one yet — e.g. documents created before this field existed.
// Never touches docId, never touches Read Site/Drawing Register documents,
// never reassigns a reference a document already has. Safe to re-run: the
// `documentRegisterReference: { $exists: false }` filter naturally excludes
// anything already migrated.
//
// Usage: node src/database/backfillDocumentRegisterReference.js
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Document } = require('../modules/documents/document.model');
const { nextDocumentRegisterReference } = require('../modules/documents/document.service');

async function backfill() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to', env.mongodbUri);

  const pending = await Document.find({
    destination: 'Document Register',
    documentRegisterReference: { $exists: false },
  }).sort({ createdAt: 1 });

  if (pending.length === 0) {
    console.log('Nothing to backfill — every Document Register document already has a reference.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Backfilling ${pending.length} Document Register document(s)...`);
  for (const doc of pending) {
    const reference = await nextDocumentRegisterReference(doc.type);
    doc.documentRegisterReference = reference;
    await doc.save();
    console.log(`  ${doc.docId} -> ${reference} (${doc.title})`);
  }

  console.log('Backfill complete.');
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
