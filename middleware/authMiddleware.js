const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

/**
 * Middleware to protect routes. Verifies the JWT and attaches user info to request.
 */
const protect = async (req, res, next) => {
  let token;

  // Check if token is present in the Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode/verify token using secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

      // Check the user's role from the token payload and fetch corresponding database user details
      if (decoded.role === 'student') {
        req.user = await Student.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'User not found in system' });
        }
        req.user.role = 'student';
      } else if (decoded.role === 'staff') {
        req.user = await Staff.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'Staff member not found in system' });
        }
        req.user.role = 'staff';
      } else {
        return res.status(401).json({ success: false, message: 'Invalid token structure' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

/**
 * Middleware helper to restrict access to specific roles (e.g. 'student' or 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role (${req.user ? req.user.role : 'none'}) is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
