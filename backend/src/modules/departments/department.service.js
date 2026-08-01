const { Department } = require('./department.model');
const { Document } = require('../documents/document.model');
const { NotFoundError } = require('../../common/errors');

async function listDepartments() {
  const departments = await Department.find().sort({ name: 1 });
  const counts = await Document.aggregate([
    { $match: { status: 'Published' } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
  ]);
  const countByDept = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return departments.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    code: d.code,
    publishedDocumentCount: countByDept.get(d._id.toString()) ?? 0,
  }));
}

async function getDepartmentById(id) {
  const department = await Department.findById(id);
  if (!department) throw new NotFoundError('Department not found');
  return department;
}

async function createDepartment({ name, code }) {
  return Department.create({ name, code });
}

module.exports = { listDepartments, getDepartmentById, createDepartment };
