const mongoose = require('mongoose');

const STATUSES = ['Active', 'Inactive'];

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: STATUSES, default: 'Active' },
  },
  { timestamps: true }
);

const Department = mongoose.model('Department', departmentSchema);

module.exports = { Department, STATUSES };
