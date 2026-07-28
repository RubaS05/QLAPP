const Payment = require('../models/Payment');
const Student = require('../models/Student');

// Lazy load Stripe to prevent crash if key is missing during startup
let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// @desc    Create Stripe Checkout Session and pending payment record
// @route   POST /api/payments/create-checkout-session
// @access  Private (Student only)
const createCheckoutSession = async (req, res, next) => {
  try {
    const { amount, description } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      res.status(400);
      throw new Error('Please provide a valid payment amount');
    }

    if (!description || !description.trim()) {
      res.status(400);
      throw new Error('Please provide a description for the payment');
    }

    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    // Create a Checkout Session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
              description: 'College Leave Management System (LMS) Fee/Fine',
            },
            unit_amount: Math.round(amount * 100), // Stripe accepts amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment-cancel`,
      metadata: {
        studentId: req.user._id.toString(),
        description: description
      }
    });

    // Create a pending payment record in our MongoDB
    await Payment.create({
      studentId: req.user._id,
      amount,
      description,
      stripeSessionId: session.id,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      url: session.url
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Stripe Checkout Session status and update MongoDB Payment record
// @route   GET /api/payments/verify-session
// @access  Private (Student only)
const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      res.status(400);
      throw new Error('session_id parameter is required');
    }

    // Find the payment record in our DB
    const payment = await Payment.findOne({ stripeSessionId: session_id }).populate('studentId', 'name email rollNumber');
    if (!payment) {
      res.status(404);
      throw new Error('Payment record not found for this Stripe Session');
    }

    // If already marked as paid, skip Stripe API call to save rate limit
    if (payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully (already processed)',
        payment
      });
    }

    // Verify session status with Stripe
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      payment.status = 'paid';
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified and processed successfully',
        payment
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      res.status(400).json({
        success: false,
        message: `Stripe checkout session payment status: ${session.payment_status}`,
        payment
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history for the authenticated student
// @route   GET /api/payments/history
// @access  Private (Student only)
const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
  verifyCheckoutSession,
  getPaymentHistory
};
