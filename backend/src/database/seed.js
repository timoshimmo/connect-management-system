/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { hashPassword } = require('../utils/password');
const { User } = require('../modules/users/user.model');
const { Department } = require('../modules/departments/department.model');
const { Discipline } = require('../modules/disciplines/discipline.model');
const { Document, DOCUMENT_TYPE_PREFIXES, POLICY_RESERVED_SEQUENCE } = require('../modules/documents/document.model');
const { Counter } = require('../modules/documents/counter.model');
const { RefreshToken } = require('../modules/auth/refreshToken.model');
const { AuditLog } = require('../modules/auditLogs/auditLog.model');
const { DrawingRegisterUser } = require('../modules/drawingRegisterUsers/drawingRegisterUser.model');
const { DrawingRegisterRefreshToken } = require('../modules/drawingRegisterAuth/drawingRegisterRefreshToken.model');

const DEMO_PASSWORD = 'password123';

// Matches production's real department list (see initProduction.js), so
// local dev/testing stays representative of what's actually there.
const DEPARTMENTS = [
  { name: 'Compliance', code: 'COM' },
  { name: 'Finance', code: 'FIN' },
  { name: 'Human Resources', code: 'HR' },
  { name: 'Health, Safety & Environment', code: 'HSE' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Operations & Maintenance', code: 'OPS' },
  { name: 'Supply Chain', code: 'SC' },
];

// Drawing Register-only — populates the Discipline dropdown when creating a
// Drawing Register document (never hardcoded on the frontend).
const DISCIPLINES = ['Mechanical', 'Piping', 'Civil', 'Electrical', 'Instrumentation'];

// Ported 1:1 from frontend/src/data/demoUsers.ts.
const USERS = [
  { name: 'L. Sule', email: 'l.sule@stac.com', role: 'author' },
  { name: 'A. Musa', email: 'a.musa@stac.com', role: 'reviewer' },
  { name: 'F. Aliyu', email: 'f.aliyu@stac.com', role: 'approver' },
  { name: 'Admin', email: 'admin@stac.com', role: 'controller' },
  { name: 'B. Usman', email: 'b.usman@stac.com', role: 'reviewer' },
  { name: 'D. Garba', email: 'd.garba@stac.com', role: 'reviewer' },
  { name: 'G. Bello', email: 'g.bello@stac.com', role: 'approver' },
  { name: 'T. Okoye', email: 't.okoye@stac.com', role: 'author' },
  { name: 'S. Garba', email: 's.garba@stac.com', role: 'reviewer' },
  { name: 'J. Bala', email: 'j.bala@stac.com', role: 'author' },
  // Referenced as authors/reviewers/approvers in seedDocuments.ts but not in the frontend's demoUsers roster.
  { name: 'K. Ibrahim', email: 'k.ibrahim@stac.com', role: 'author' },
  { name: 'R. Shehu', email: 'r.shehu@stac.com', role: 'author' },
  { name: 'M. Danladi', email: 'm.danladi@stac.com', role: 'author' },
  { name: 'N. Abubakar', email: 'n.abubakar@stac.com', role: 'author' },
  { name: 'O. Yakubu', email: 'o.yakubu@stac.com', role: 'author' },
  { name: 'C. Okafor', email: 'c.okafor@stac.com', role: 'author' },
  { name: 'J. Adamu', email: 'j.adamu@stac.com', role: 'author' },
];

// Drawing Register viewer accounts — a separate account system from the
// User collection above (see drawingRegisterUser.model.js). They can only
// sign in and browse whatever Documents were routed to the Drawing Register.
const DR_USERS = [
  { name: 'E. Adeyemi', email: 'e.adeyemi@stac.com', jobTitle: 'Piping Engineer' },
  { name: 'H. Bassey', email: 'h.bassey@stac.com', jobTitle: 'Site Engineer' },
];

// Ported from frontend/src/data/seedDocuments.ts, updated to the current
// department names and document types. `destination` marks which storefront
// the document is published to once approved — most stay on the default
// 'Read Site'; a handful of Operations & HSE documents are routed to
// 'Drawing Register' below for a populated demo. `docId` is NOT hardcoded
// here — see nextDocId() below, which mirrors document.service.js's real
// numbering convention so local test data looks like what the app actually
// generates (SMS-XX NNN for Read Site, DEPT-YEAR-NNN for Drawing Register).
const DOCUMENTS = [
  { title: 'Overtime Policy', department: 'Human Resources', type: 'Policy', status: 'Draft', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Defines eligibility and approval process for overtime pay.', location: 'Onshore', notes: '' },
  { title: 'Dress Code Policy', department: 'Human Resources', type: 'Policy', status: 'Draft', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Onshore and offshore dress code standards.', location: 'Onshore', notes: '' },
  { title: 'Petty Cash Procedure', department: 'Finance', type: 'Procedure', status: 'Draft', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Petty cash float, reconciliation and replenishment steps.', location: 'Onshore', notes: '' },
  { title: 'Modern Slavery Statement', department: 'Compliance', type: 'Policy', status: 'Draft', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Annual statement on modern slavery and human trafficking.', location: 'Both', notes: 'Work in progress' },

  { title: 'Emergency Evacuation Procedure', department: 'Health, Safety & Environment', type: 'Procedure', status: 'Pending Assignment', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Site evacuation routes, muster points and roll call.', location: 'Both', notes: '' },
  { title: 'Password Policy', department: 'Information Technology', type: 'Policy', status: 'Pending Assignment', author: 'L. Sule', reviewer: null, approver: null, publishedDate: null, nextReviewDate: null, description: 'Minimum password complexity and rotation requirements.', location: 'Onshore', notes: '' },

  { title: 'Flexible Working Policy', department: 'Human Resources', type: 'Policy', status: 'Under Review', author: 'O. Yakubu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: null, nextReviewDate: null, description: 'Remote and flexible working arrangements.', location: 'Onshore', notes: '' },
  { title: 'Emergency Response Plan v3.2', department: 'Health, Safety & Environment', type: 'Procedure', status: 'Under Review', author: 'J. Adamu', reviewer: 'A. Musa', approver: 'G. Bello', publishedDate: null, nextReviewDate: null, description: 'Site-wide emergency response and escalation plan.', location: 'Both', notes: '' },
  { title: 'Equipment Inspection Standard', department: 'Operations & Maintenance', type: 'Standard', status: 'Under Review', author: 'R. Shehu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: null, nextReviewDate: null, description: 'Periodic inspection intervals for rotating equipment.', location: 'Onshore', notes: '' },
  { title: 'IT Security Framework 2026', department: 'Information Technology', type: 'Standard', status: 'Under Review', author: 'C. Okafor', reviewer: 'B. Usman', approver: 'G. Bello', publishedDate: null, nextReviewDate: null, description: 'Baseline security controls for endpoints and network.', location: 'Onshore', notes: '' },

  { title: 'Conflict of Interest Policy v2', department: 'Compliance', type: 'Policy', status: 'Pending Approval', author: 'K. Ibrahim', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: null, nextReviewDate: null, description: 'Disclosure and management of conflicts of interest.', location: 'Onshore', notes: '' },
  { title: 'Financial Authorization Matrix v2', department: 'Finance', type: 'Standard', status: 'Pending Approval', author: 'N. Abubakar', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: null, nextReviewDate: null, description: 'Sign-off limits by role and transaction value.', location: 'Onshore', notes: '' },
  { title: 'Supplier Onboarding Procedure', department: 'Supply Chain', type: 'Procedure', status: 'Pending Approval', author: 'M. Danladi', reviewer: 'D. Garba', approver: 'G. Bello', publishedDate: null, nextReviewDate: null, description: 'Due diligence and setup steps for new suppliers.', location: 'Onshore', notes: '' },

  { title: 'Recruitment & Selection Procedure', department: 'Human Resources', type: 'Procedure', status: 'Pending Publishing', author: 'O. Yakubu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: null, nextReviewDate: null, description: 'End-to-end hiring process from requisition to offer.', location: 'Onshore', notes: '' },
  { title: 'Permit to Work Standard', department: 'Health, Safety & Environment', type: 'Standard', status: 'Pending Publishing', author: 'J. Adamu', reviewer: 'B. Usman', approver: 'G. Bello', publishedDate: null, nextReviewDate: null, description: 'Hot work, confined space and lifting permit requirements.', location: 'Both', notes: '', destination: 'Drawing Register', drawingNumber: 'DWG-HSE-009', discipline: 'Electrical', revision: 'Rev A' },

  { title: 'Compliance Code of Conduct 2026', department: 'Compliance', type: 'Policy', status: 'Published', author: 'K. Ibrahim', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-06-03', nextReviewDate: '2027-06-03', description: 'Standards of ethical conduct expected of all staff.', location: 'Both', notes: '' },
  { title: 'Anti-Bribery & Corruption Policy', department: 'Compliance', type: 'Policy', status: 'Published', author: 'K. Ibrahim', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-03-15', nextReviewDate: '2027-03-15', description: 'Prohibited conduct and gift/hospitality thresholds.', location: 'Both', notes: '' },
  { title: 'Budget Planning Procedure v3', department: 'Finance', type: 'Procedure', status: 'Published', author: 'N. Abubakar', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: '2026-06-07', nextReviewDate: '2027-06-07', description: 'Annual budget cycle, templates and approval gates.', location: 'Onshore', notes: '' },
  { title: 'Travel & Expenses Policy', department: 'Finance', type: 'Policy', status: 'Published', author: 'L. Sule', reviewer: 'A. Musa', approver: 'G. Bello', publishedDate: '2026-06-12', nextReviewDate: '2027-06-12', description: 'Per-diem rates and expense claim requirements.', location: 'Onshore', notes: '' },
  { title: 'HR Leave Management Policy', department: 'Human Resources', type: 'Policy', status: 'Published', author: 'O. Yakubu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-05-10', nextReviewDate: '2027-05-10', description: 'Annual, sick and compassionate leave entitlements.', location: 'Onshore', notes: '' },
  { title: 'Induction Programme Standard', department: 'Human Resources', type: 'Standard', status: 'Published', author: 'L. Sule', reviewer: 'B. Usman', approver: 'G. Bello', publishedDate: '2026-01-12', nextReviewDate: '2027-01-12', description: 'New-hire orientation checklist and timelines.', location: 'Onshore', notes: '' },
  { title: 'HSE Incident Reporting Procedure', department: 'Health, Safety & Environment', type: 'Procedure', status: 'Published', author: 'J. Adamu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-05-14', nextReviewDate: '2027-05-14', description: 'Reporting, investigation and close-out of HSE incidents.', location: 'Offshore – Mayo ABO', notes: '' },
  { title: 'Personal Protective Equipment Standard', department: 'Health, Safety & Environment', type: 'Standard', status: 'Published', author: 'J. Adamu', reviewer: 'B. Usman', approver: 'G. Bello', publishedDate: '2026-02-01', nextReviewDate: '2027-02-01', description: 'Minimum PPE requirements by work area.', location: 'Both', notes: '' },
  { title: 'Data Protection & Privacy Policy', department: 'Information Technology', type: 'Policy', status: 'Published', author: 'C. Okafor', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-05-20', nextReviewDate: '2027-05-20', description: 'Handling of personal and confidential data.', location: 'Onshore', notes: '' },
  { title: 'Acceptable Use of IT Assets', department: 'Information Technology', type: 'Policy', status: 'Published', author: 'C. Okafor', reviewer: 'B. Usman', approver: 'G. Bello', publishedDate: '2026-01-05', nextReviewDate: '2027-01-05', description: 'Acceptable use rules for company laptops, email and network.', location: 'Onshore', notes: '' },
  { title: 'Mayo ABO Operating Procedures v5', department: 'Operations & Maintenance', type: 'Procedure', status: 'Published', author: 'R. Shehu', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2026-06-01', nextReviewDate: '2027-06-01', description: 'Standard operating procedures for offshore facility.', location: 'Offshore – Mayo ABO', notes: '', destination: 'Drawing Register', drawingNumber: 'DWG-OPS-001', discipline: 'Mechanical', area: 'Mayo ABO', revision: 'Rev C' },
  { title: 'Preventive Maintenance Schedule', department: 'Operations & Maintenance', type: 'Standard', status: 'Published', author: 'R. Shehu', reviewer: 'D. Garba', approver: 'G. Bello', publishedDate: '2026-01-20', nextReviewDate: '2027-01-20', description: 'Preventive maintenance intervals by asset class.', location: 'Onshore', notes: '', destination: 'Drawing Register', drawingNumber: 'DWG-OPS-002', discipline: 'Mechanical', revision: 'Rev B' },
  { title: 'Contract Management Policy', department: 'Supply Chain', type: 'Policy', status: 'Published', author: 'M. Danladi', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: '2025-12-01', nextReviewDate: '2026-12-01', description: 'Contract award, variation and close-out process.', location: 'Onshore', notes: '' },
  { title: 'Inventory Management Procedure', department: 'Supply Chain', type: 'Procedure', status: 'Published', author: 'N. Abubakar', reviewer: 'D. Garba', approver: 'G. Bello', publishedDate: '2025-11-01', nextReviewDate: '2026-11-01', description: 'Stock counts, reorder points and write-off approval.', location: 'Both', notes: '' },

  { title: 'Records Retention Policy', department: 'Compliance', type: 'Policy', status: 'Published', author: 'M. Danladi', reviewer: 'A. Musa', approver: 'F. Aliyu', publishedDate: '2025-06-05', nextReviewDate: '2026-06-05', description: 'Retention periods and disposal schedule by record type.', location: 'Both', notes: '' },
  { title: 'Audit Trail Standard', department: 'Compliance', type: 'Standard', status: 'Published', author: 'K. Ibrahim', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: '2025-05-01', nextReviewDate: '2026-05-01', description: 'Minimum audit logging requirements for financial systems.', location: 'Both', notes: '' },
  { title: 'Financial Reporting Standard', department: 'Finance', type: 'Standard', status: 'Published', author: 'N. Abubakar', reviewer: 'D. Garba', approver: 'F. Aliyu', publishedDate: '2025-06-15', nextReviewDate: '2026-06-15', description: 'Month-end close and management reporting requirements.', location: 'Both', notes: '' },

  { title: 'Compliance Training Procedure (Superseded)', department: 'Compliance', type: 'Procedure', status: 'Archived', author: 'M. Danladi', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: '2024-10-01', nextReviewDate: null, description: 'Superseded by Compliance Code of Conduct 2026 training module.', location: 'Onshore', notes: 'Archived – superseded by new version' },
  { title: 'Import & Export Compliance (Superseded)', department: 'Supply Chain', type: 'Policy', status: 'Archived', author: 'N. Abubakar', reviewer: 'B. Usman', approver: 'F. Aliyu', publishedDate: '2024-06-01', nextReviewDate: null, description: 'Superseded by updated customs and trade compliance procedure.', location: 'Onshore', notes: 'Archived – superseded' },

  // Document Register — Controller-registered controlled QHSE documents,
  // created directly as Published (no review workflow). See
  // documentRegister.controller.js / document.service.js's createDocument.
  { title: 'QHSE Management System Manual', department: 'Compliance', type: 'Manual', status: 'Published', author: 'Admin', reviewer: null, approver: null, publishedDate: '2026-08-13', nextReviewDate: '2027-08-13', description: 'The overarching QHSE Management System manual.', location: 'Both', notes: '', destination: 'Document Register', revision: '0', isoStandards: ['ISO 9001 (Quality)', 'ISO 14001 (Environment)', 'ISO 45001 (OH&S)'], isoClauses: '4–10' },
  { title: 'QHSE Risk and Opportunities Register Procedure', department: 'Compliance', type: 'Procedure', status: 'Published', author: 'Admin', reviewer: null, approver: null, publishedDate: '2026-08-13', nextReviewDate: '2027-08-13', description: 'How QHSE risks and opportunities are identified, assessed and tracked.', location: 'Both', notes: '', destination: 'Document Register', revision: '0', isoStandards: ['ISO 9001 (Quality)'], isoClauses: '6.1.1' },
  { title: 'Context of the Organization & Interested Parties Procedure', department: 'Compliance', type: 'Procedure', status: 'Published', author: 'Admin', reviewer: null, approver: null, publishedDate: '2026-08-13', nextReviewDate: '2027-08-13', description: 'Determining internal/external issues and interested-party requirements.', location: 'Both', notes: '', destination: 'Document Register', revision: '0', isoStandards: ['ISO 9001 (Quality)', 'ISO 14001 (Environment)'], isoClauses: '4.1–4.2' },
  { title: 'Roles, Responsibilities & Authorities Procedure', department: 'Compliance', type: 'Procedure', status: 'Published', author: 'Admin', reviewer: null, approver: null, publishedDate: '2026-08-13', nextReviewDate: '2027-08-13', description: 'Assigns QHSE roles, responsibilities and authorities across the organization.', location: 'Both', notes: '', destination: 'Document Register', revision: '0', isoStandards: ['ISO 9001 (Quality)', 'ISO 45001 (OH&S)'], isoClauses: '5.3' },
  { title: 'Environmental Aspects & OH&S Hazard Evaluation Procedure', department: 'Health, Safety & Environment', type: 'Procedure', status: 'Published', author: 'Admin', reviewer: null, approver: null, publishedDate: '2026-08-13', nextReviewDate: '2027-08-13', description: 'Identifying environmental aspects and OH&S hazards and evaluating their significance.', location: 'Both', notes: '', destination: 'Document Register', revision: '0', isoStandards: ['ISO 14001 (Environment)', 'ISO 45001 (OH&S)'], isoClauses: '6.1.2' },
];

// Mirrors document.service.js's nextDocIdForType/nextDocIdByDepartment so
// seeded docIds look exactly like what the real app generates: SMS-XXNNNNN
// (no separator, 5 digits) for Read Site/Document Register, DEPT-YEAR-NNN
// for Drawing Register.
const typeSequence = {};
function nextDocId(d, departmentCode) {
  if (d.destination === 'Drawing Register') {
    const year = new Date().getFullYear();
    const deptPrefix = `${departmentCode}-${year}-`;
    typeSequence[deptPrefix] = (typeSequence[deptPrefix] ?? 0) + 1;
    return `${deptPrefix}${String(typeSequence[deptPrefix]).padStart(3, '0')}`;
  }
  const prefix = DOCUMENT_TYPE_PREFIXES[d.type];
  const isPolicy = d.type === 'Policy';
  const baseline = isPolicy ? POLICY_RESERVED_SEQUENCE : 0;
  typeSequence[prefix] = (typeSequence[prefix] ?? baseline) + 1;
  return `${prefix}${String(typeSequence[prefix]).padStart(5, '0')}`;
}

async function seed() {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to', env.mongodbUri);

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Discipline.deleteMany({}),
    Document.deleteMany({}),
    Counter.deleteMany({}),
    RefreshToken.deleteMany({}),
    AuditLog.deleteMany({}),
    DrawingRegisterUser.deleteMany({}),
    DrawingRegisterRefreshToken.deleteMany({}),
  ]);

  console.log('Seeding departments...');
  const departmentByName = new Map();
  const departmentCodeByName = new Map();
  for (const dept of DEPARTMENTS) {
    const created = await Department.create(dept);
    departmentByName.set(dept.name, created._id);
    departmentCodeByName.set(dept.name, dept.code);
  }

  console.log('Seeding disciplines...');
  const disciplineByName = new Map();
  for (const name of DISCIPLINES) {
    const created = await Discipline.create({ name });
    disciplineByName.set(name, created._id);
  }

  console.log('Seeding users (all share the password "%s")...', DEMO_PASSWORD);
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const userByName = new Map();
  for (const u of USERS) {
    const created = await User.create({ ...u, passwordHash });
    userByName.set(u.name, created._id);
  }

  console.log('Seeding documents (metadata only — no files uploaded; use the app or API to attach real files)...');
  for (const d of DOCUMENTS) {
    await Document.create({
      docId: nextDocId(d, departmentCodeByName.get(d.department)),
      title: d.title,
      department: departmentByName.get(d.department),
      type: d.type,
      status: d.status,
      author: userByName.get(d.author),
      reviewer: d.reviewer ? userByName.get(d.reviewer) : null,
      approver: d.approver ? userByName.get(d.approver) : null,
      description: d.description,
      location: d.location,
      destination: d.destination || 'Read Site',
      notes: d.notes,
      drawingNumber: d.drawingNumber || '',
      discipline: d.discipline ? disciplineByName.get(d.discipline) : null,
      area: d.area || '',
      revision: d.revision || '',
      isoStandards: d.isoStandards || [],
      isoClauses: d.isoClauses || '',
      publishedAt: d.publishedDate ? new Date(d.publishedDate) : null,
      nextReviewDate: d.nextReviewDate ? new Date(d.nextReviewDate) : null,
    });
  }

  // Catch up the real atomic Counter collection (document.service.js's
  // nextSequence) to match what was just seeded — this loop numbers
  // documents itself rather than calling the app's real numbering
  // functions, so without this the Counter would start back at 0 and the
  // very next real document created after seeding would collide with (and
  // have to retry past) every docId just seeded. Drawing Register's
  // DEPT-YEAR- keys are skipped: that scheme still scans for the highest
  // existing docId rather than using a Counter (see document.service.js's
  // nextDocIdByDepartment), so nothing to seed there.
  const typePrefixes = new Set(Object.values(DOCUMENT_TYPE_PREFIXES));
  await Promise.all(
    Object.entries(typeSequence)
      .filter(([prefix]) => typePrefixes.has(prefix))
      .map(([prefix, seq]) => Counter.updateOne({ _id: prefix }, { $set: { seq } }, { upsert: true }))
  );

  console.log('Seeding Drawing Register users (all share the password "%s")...', DEMO_PASSWORD);
  const drPasswordHash = await hashPassword(DEMO_PASSWORD);
  for (const u of DR_USERS) {
    await DrawingRegisterUser.create({ ...u, passwordHash: drPasswordHash });
  }

  console.log(
    'Done. Seeded %d departments, %d disciplines, %d users, %d documents, %d Drawing Register users.',
    DEPARTMENTS.length,
    DISCIPLINES.length,
    USERS.length,
    DOCUMENTS.length,
    DR_USERS.length
  );
  console.log('All demo accounts share the password "%s" (e.g. l.sule@stac.com / %s).', DEMO_PASSWORD, DEMO_PASSWORD);
  console.log('Drawing Register demo login: e.adeyemi@stac.com / %s (separate account system).', DEMO_PASSWORD);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
