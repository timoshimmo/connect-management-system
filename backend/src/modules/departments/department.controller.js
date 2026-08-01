const asyncHandler = require('../../utils/asyncHandler');
const departmentService = require('./department.service');

const list = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments();
  res.json({ items: departments });
});

const create = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  res.status(201).json({ department });
});

module.exports = { list, create };
