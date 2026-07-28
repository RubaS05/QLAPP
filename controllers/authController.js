const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Staff = require('../models/Staff');

/**
 * Generate a JWT token containing user database ID and role
 * @param {string} id - Database ObjectId
 * @param {string} role - 'student' or 'staff'
 * @returns {string} - Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_key',
    { expiresIn: '30d' } // Token expires in 30 days
  );
};

// @desc    Register a new student
// @route   POST /api/auth/register/student
// @access  Public
const registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, department } = req.body;

    // Validate request inputs
    if (!name || !email || !password || !rollNumber || !department) {
      res.status(400);
      throw new Error('Please fill out all student registration fields');
    }

    // Check if student email is already registered
    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('A student account with this email already exists');
    }

    // Check if roll number is already registered
    const rollExists = await Student.findOne({ rollNumber });
    if (rollExists) {
      res.status(400);
      throw new Error('A student account with this roll number already exists');
    }

    // Create student (pre-save hook hashes password)
    const student = await Student.create({
      name,
      email,
      password,
      rollNumber,
      department
    });

    if (student) {
      res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        token: generateToken(student._id, 'student'),
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          department: student.department,
          role: 'student'
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid student data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new staff member
// @route   POST /api/auth/register/staff
// @access  Public
const registerStaff = async (req, res, next) => {
  try {
    const { name, email, password, department, designation } = req.body;

    if (!name || !email || !password || !department || !designation) {
      res.status(400);
      throw new Error('Please fill out all staff registration fields');
    }

    const emailExists = await Staff.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('A staff account with this email already exists');
    }

    const staff = await Staff.create({
      name,
      email,
      password,
      department,
      designation
    });

    if (staff) {
      res.status(201).json({
        success: true,
        message: 'Staff registered successfully',
        token: generateToken(staff._id, 'staff'),
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          designation: staff.designation,
          role: 'staff'
        }
      });
    } else {
      res.status(400);
      throw new Error('Invalid staff data provided');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate student & get token
// @route   POST /api/auth/login/student
// @access  Public
const loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Find student in DB and explicitly request password field
    const student = await Student.findOne({ email }).select('+password');

    if (student && (await student.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(student._id, 'student'),
        user: {
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber,
          department: student.department,
          role: 'student'
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid student credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate staff member & get token
// @route   POST /api/auth/login/staff
// @access  Public
const loginStaff = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const staff = await Staff.findOne({ email }).select('+password');

    if (staff && (await staff.matchPassword(password))) {
      res.json({
        success: true,
        message: 'Login successful',
        token: generateToken(staff._id, 'staff'),
        user: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          designation: staff.designation,
          role: 'staff'
        }
      });
    } else {
      res.status(401);
      throw new Error('Invalid staff credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user has already been populated by protect middleware
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user profile missing');
    }

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        department: req.user.department,
        role: req.user.role,
        // include role-specific fields
        rollNumber: req.user.rollNumber || undefined,
        designation: req.user.designation || undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  registerStaff,
  loginStudent,
  loginStaff,
  getMe
};
