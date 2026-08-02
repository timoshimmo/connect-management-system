const mongoose = require('mongoose');

const STATUSES = ['Active', 'Inactive'];

/**
 * Engineering disciplines (Mechanical, Piping, Civil, ...) offered on the
 * Drawing Register branch of the Create Document form. A real, admin-managed
 * collection rather than a hardcoded enum — see requirement 5: "Do not
 * hardcode discipline values."
 */
const disciplineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    status: { type: String, enum: STATUSES, default: 'Active' },
  },
  { timestamps: true }
);

const Discipline = mongoose.model('Discipline', disciplineSchema);

module.exports = { Discipline, STATUSES };
