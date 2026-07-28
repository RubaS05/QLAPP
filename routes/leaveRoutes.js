const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  applyLeave,
  getStudentHistory,
  getStaffPending,
  getStaffHistory,
  respondLeaveRequest,
  getStaffList
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique name prefix with timestamp to avoid duplicates
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Configure file types whitelist filter (Images & PDFs only)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|pdf/;
  const isExtensionAllowed = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const isMimetypeAllowed = allowedExtensions.test(file.mimetype);

  if (isExtensionAllowed && isMimetypeAllowed) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG/JPG/PNG) and PDF certificates are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Megabytes limit
  fileFilter: fileFilter
});

// Apply for leave (Student role only) - Handles optional file upload field "attachment"
router.post('/apply', protect, authorize('student'), upload.single('attachment'), applyLeave);

// Get student's leave request history (Student role only)
router.get('/student/history', protect, authorize('student'), getStudentHistory);

// Get staff's pending leave requests (Staff role only)
router.get('/staff/pending', protect, authorize('staff'), getStaffPending);

// Get staff's resolved leave history (Staff role only)
router.get('/staff/history', protect, authorize('staff'), getStaffHistory);

// Approve or reject a specific leave request (Staff role only)
router.put('/respond/:id', protect, authorize('staff'), respondLeaveRequest);

// Get list of all staff members (accessible by any logged-in user, primarily used by students)
router.get('/staff-list', protect, getStaffList);

module.exports = router;
