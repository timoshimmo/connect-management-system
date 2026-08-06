/* eslint-disable no-console */
/**
 * One-off cleanup: MOC ("Management of Change") was removed from the
 * department list per the naming-convention update. This deletes the MOC
 * Department document from production if — and only if — nothing still
 * references it, so it never leaves a dangling reference behind.
 *
 * Usage: MONGODB_URI="<production-uri>" node src/database/removeMocDepartment.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Department } = require('../modules/departments/department.model');
const { Document } = require('../modules/documents/document.model');
const { User } = require('../modules/users/user.model');
const { ContactMessage } = require('../modules/contactMessages/contactMessage.model');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to:', mongoose.connection.name);

  const moc = await Department.findOne({ code: 'MOC' });
  if (!moc) {
    console.log('No MOC department found — nothing to do.');
    return;
  }
  console.log('Found MOC department:', moc._id.toString());

  const [docCount, userCount, contactCount] = await Promise.all([
    Document.countDocuments({ department: moc._id }),
    User.countDocuments({ department: moc._id }),
    ContactMessage.countDocuments({ department: moc._id }),
  ]);
  console.log({ docCount, userCount, contactCount });

  if (docCount > 0 || userCount > 0 || contactCount > 0) {
    console.log('MOC department is still referenced — refusing to delete.');
    return;
  }

  await Department.deleteOne({ _id: moc._id });
  console.log('Deleted MOC department.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
