const express = require('express');
const router = express.Router();
const {
  registerStudent,
  registerStaff,
  loginStudent,
  loginStaff,
  getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public signup routes
router.post('/register/student', registerStudent);
router.post('/register/staff', registerStaff);

// Public login routes
router.post('/login/student', loginStudent);
router.post('/login/staff', loginStaff);

// Protected session route (fetches logged in user info using JWT bearer token)
router.get('/me', protect, getMe);

module.exports = router;
