const mongoose = require('mongoose');

/** Mirrors auth/refreshToken.model.js, but for DrawingRegisterUser sessions — kept as a separate collection so the two auth systems never share state. */
const drawingRegisterRefreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'DrawingRegisterUser', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const DrawingRegisterRefreshToken = mongoose.model('DrawingRegisterRefreshToken', drawingRegisterRefreshTokenSchema);

module.exports = { DrawingRegisterRefreshToken };
