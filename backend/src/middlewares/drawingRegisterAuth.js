const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../common/errors');

/**
 * Verifies a Drawing Register Bearer access token and attaches
 * { id, name } to req.drawingRegisterUser. Only tokens carrying
 * `type: 'drawing-register'` (issued by drawingRegisterAuth.service.js)
 * are accepted — an MS Publishing access token is a well-formed, validly
 * signed JWT too, but lacks that claim, so it's rejected here just as a
 * Drawing Register token is rejected by middlewares/auth.js's authenticate.
 * This is the real separation boundary requirement 2 asks for, not just a
 * role check.
 */
function authenticateDrawingRegister(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type !== 'drawing-register') {
      return next(new UnauthorizedError('Invalid or expired access token'));
    }
    req.drawingRegisterUser = { id: decoded.sub, name: decoded.name };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

module.exports = { authenticateDrawingRegister };
