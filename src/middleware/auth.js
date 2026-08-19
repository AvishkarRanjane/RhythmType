const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rhythmtype_super_secret_jwt_key_change_in_production_2026';

/**
 * Required Authentication Middleware
 * Returns 401 Unauthorized if missing or invalid JWT
 */
const authenticateToken = (req, res, next) => {
  let token = req.cookies ? req.cookies.token : null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to req.user if valid token exists, otherwise leaves req.user null
 */
const optionalAuth = (req, res, next) => {
  let token = req.cookies ? req.cookies.token : null;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
