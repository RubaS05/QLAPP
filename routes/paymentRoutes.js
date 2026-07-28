const express = require('express');
const router = express.Router();
const {
  createCheckoutSession,
  verifyCheckoutSession,
  getPaymentHistory
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create checkout session (students only)
router.post('/create-checkout-session', protect, authorize('student'), createCheckoutSession);

// Verify checkout session status (students only)
router.get('/verify-session', protect, authorize('student'), verifyCheckoutSession);

// Get student's payment history log (students only)
router.get('/history', protect, authorize('student'), getPaymentHistory);

module.exports = router;
