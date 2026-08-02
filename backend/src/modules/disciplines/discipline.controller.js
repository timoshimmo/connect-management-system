const asyncHandler = require('../../utils/asyncHandler');
const disciplineService = require('./discipline.service');
const { parsePagination, paginatedResponse } = require('../../common/pagination');
const { recordAudit } = require('../auditLogs/auditLog.service');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { items, total } = await disciplineService.listDisciplines({
    search: req.query.search,
    status: req.query.status,
    skip,
    limit,
  });
  res.json(paginatedResponse(items, total, page, limit));
});

const create = asyncHandler(async (req, res) => {
  const discipline = await disciplineService.createDiscipline(req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'discipline',
    targetId: discipline.id,
    metadata: { created: true },
  });
  res.status(201).json({ discipline });
});

const update = asyncHandler(async (req, res) => {
  const discipline = await disciplineService.updateDiscipline(req.params.id, req.body);
  await recordAudit({
    user: req.user.id,
    action: 'edit',
    targetType: 'discipline',
    targetId: discipline.id,
    metadata: { updatedFields: Object.keys(req.body) },
  });
  res.json({ discipline });
});

module.exports = { list, create, update };
