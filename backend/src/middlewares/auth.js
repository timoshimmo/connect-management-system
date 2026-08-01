const { verifyAccessToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../common/errors');

/**
 * Verifies the Bearer access token and attaches { id, name, role } to
 * req.user. Rejects Drawing Register tokens outright (identified by their
 * `type: 'drawing-register'` claim, set in drawingRegisterAuth.service.js) —
 * the two auth systems are separate accounts/collections/sessions, so a
 * Drawing Register token must never be usable on an MS Publishing route,
 * even one with no role check. See middlewares/drawingRegisterAuth.js for
 * the mirror-image guard on the other side.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length);
  try {
    const decoded = verifyAccessToken(token);
    if (decoded.type === 'drawing-register') {
      return next(new UnauthorizedError('Invalid or expired access token'));
    }
    req.user = { id: decoded.sub, name: decoded.name, role: decoded.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}

module.exports = { authenticate };
