const { Department } = require('./department.model');
const { Document } = require('../documents/document.model');
const { NotFoundError, ConflictError } = require('../../common/errors');

/**
 * Powers both the simple dropdown-population call (no page/limit/search/status
 * params — frontend passes a large `limit` and `status=Active` explicitly,
 * see features/departments/hooks.ts) and the admin Department Management
 * table (search + pagination + all statuses so Inactive departments can be
 * found and reactivated).
 */
async function listDepartments({ search, status, skip = 0, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [{ name: new RegExp(search, 'i') }, { code: new RegExp(search, 'i') }];
  }

  const [departments, total, counts] = await Promise.all([
    Department.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Department.countDocuments(filter),
    Document.aggregate([
      { $match: { status: 'Published' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
  ]);
  const countByDept = new Map(counts.map((c) => [c._id.toString(), c.count]));

  const items = departments.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    code: d.code,
    status: d.status,
    publishedDocumentCount: countByDept.get(d._id.toString()) ?? 0,
  }));

  return { items, total };
}

async function getDepartmentById(id) {
  const department = await Department.findById(id);
  if (!department) throw new NotFoundError('Department not found');
  return department;
}

/** Matches the shape listDepartments() maps to, so create/update responses are consistent with the list. */
async function toDTO(department) {
  const publishedDocumentCount = await Document.countDocuments({ department: department._id, status: 'Published' });
  return {
    id: department._id.toString(),
    name: department.name,
    code: department.code,
    status: department.status,
    publishedDocumentCount,
  };
}

async function createDepartment({ name, code, status }) {
  const existing = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
  if (existing) throw new ConflictError('A department with this name or code already exists.');
  const department = await Department.create({ name, code, status: status || 'Active' });
  return toDTO(department);
}

async function updateDepartment(id, updates) {
  const department = await getDepartmentById(id);

  if (updates.name !== undefined || updates.code !== undefined) {
    const nextName = updates.name ?? department.name;
    const nextCode = (updates.code ?? department.code).toUpperCase();
    const existing = await Department.findOne({
      _id: { $ne: id },
      $or: [{ name: nextName }, { code: nextCode }],
    });
    if (existing) throw new ConflictError('A department with this name or code already exists.');
  }

  if (updates.name !== undefined) department.name = updates.name;
  if (updates.code !== undefined) department.code = updates.code;
  if (updates.status !== undefined) department.status = updates.status;

  await department.save();
  return toDTO(department);
}

module.exports = { listDepartments, getDepartmentById, createDepartment, updateDepartment };
