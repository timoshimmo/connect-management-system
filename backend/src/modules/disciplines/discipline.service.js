const { Discipline } = require('./discipline.model');
const { NotFoundError, ConflictError } = require('../../common/errors');

function toDTO(discipline) {
  return { id: discipline._id.toString(), name: discipline.name, status: discipline.status };
}

async function listDisciplines({ search, status, skip = 0, limit = 20 } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.name = new RegExp(search, 'i');

  const [disciplines, total] = await Promise.all([
    Discipline.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Discipline.countDocuments(filter),
  ]);
  return { items: disciplines.map(toDTO), total };
}

async function getDisciplineById(id) {
  const discipline = await Discipline.findById(id);
  if (!discipline) throw new NotFoundError('Discipline not found');
  return discipline;
}

async function createDiscipline({ name, status }) {
  const existing = await Discipline.findOne({ name });
  if (existing) throw new ConflictError('A discipline with this name already exists.');
  const discipline = await Discipline.create({ name, status: status || 'Active' });
  return toDTO(discipline);
}

async function updateDiscipline(id, updates) {
  const discipline = await getDisciplineById(id);

  if (updates.name !== undefined && updates.name !== discipline.name) {
    const existing = await Discipline.findOne({ _id: { $ne: id }, name: updates.name });
    if (existing) throw new ConflictError('A discipline with this name already exists.');
    discipline.name = updates.name;
  }
  if (updates.status !== undefined) discipline.status = updates.status;

  await discipline.save();
  return toDTO(discipline);
}

module.exports = { listDisciplines, getDisciplineById, createDiscipline, updateDiscipline };
