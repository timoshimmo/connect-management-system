/* eslint-disable no-console */
/**
 * Non-destructive production initialization — unlike seed.js (which wipes
 * every collection and fills it with demo data), this script never deletes
 * anything and is safe to re-run: it only creates the real Departments/
 * Disciplines the app needs to function, and creates-or-updates one real
 * Document Controller account. No demo users, no demo documents.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const env = require('../config/env');
const { hashPassword } = require('../utils/password');
const { Department } = require('../modules/departments/department.model');
const { Discipline } = require('../modules/disciplines/discipline.model');
const { User } = require('../modules/users/user.model');
const { inviteUser } = require('../modules/auth/auth.service');

// Per the company's Management System Naming Convention document.
const DEPARTMENTS = [
  { name: 'Compliance', code: 'COM' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Health, Safety & Environment', code: 'HSE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Operations & Maintenance', code: 'OPS' },
  { name: 'Supply Chain', code: 'SC' },
];

// Drawing Register-only — populates the Discipline dropdown, never hardcoded on the frontend.
const DISCIPLINES = ['Mechanical', 'Piping', 'Civil', 'Electrical', 'Instrumentation'];

const CONTROLLER_ACCOUNT = {
  name: 'Chinwe Ogbonda',
  email: 'Chinwe.Ogbonda@stac-marine.com',
  role: 'controller',
};

async function upsertDepartments() {
  let created = 0;
  for (const dept of DEPARTMENTS) {
    const existing = await Department.findOne({ $or: [{ name: dept.name }, { code: dept.code }] });
    if (!existing) {
      await Department.create({ ...dept, status: 'Active' });
      created += 1;
    }
  }
  console.log(`Departments: ${created} created, ${DEPARTMENTS.length - created} already present.`);
}

async function upsertDisciplines() {
  let created = 0;
  for (const name of DISCIPLINES) {
    const existing = await Discipline.findOne({ name });
    if (!existing) {
      await Discipline.create({ name, status: 'Active' });
      created += 1;
    }
  }
  console.log(`Disciplines: ${created} created, ${DISCIPLINES.length - created} already present.`);
}

async function upsertControllerAccount() {
  const email = CONTROLLER_ACCOUNT.email.toLowerCase();
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = 'controller';
    existing.status = 'Active';
    await existing.save();
    console.log(`Controller account already existed (${email}) — role/status confirmed as controller/Active. Password left untouched.`);
    return;
  }

  // Random, never-logged password — the account owner sets their own via
  // the invite email below, so nobody (including whoever runs this script)
  // ever needs to know or type it.
  const randomPassword = crypto.randomBytes(24).toString('base64url');
  const passwordHash = await hashPassword(randomPassword);
  const user = await User.create({
    name: CONTROLLER_ACCOUNT.name,
    email,
    passwordHash,
    role: CONTROLLER_ACCOUNT.role,
    department: null,
    status: 'Active',
  });

  const { link } = await inviteUser(user);
  console.log(`Controller account created (${email}).`);
  console.log(`Set-password link (also emailed if SMTP is configured): ${link}`);
}

async function main() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to', mongoose.connection.name);

  await upsertDepartments();
  await upsertDisciplines();
  await upsertControllerAccount();

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Production init failed:', err);
  process.exit(1);
});
