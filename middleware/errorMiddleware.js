/**
 * Handles requests that do not match any defined API routes (404 Not Found)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Catches all errors thrown in controllers and formats them nicely before responding
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle specific Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle Mongoose cast error (bad Object ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for: ${err.path}`;
  }

  // Handle MongoDB duplicate key error (duplicate email etc.)
  if (err.code === 11000 || err.code === '23505') {
    statusCode = 400;
    message = 'Duplicate field value entered. An account with this detail already exists.';
  }

  // Handle PostgreSQL invalid input syntax/bad parameter format (code '22P02')
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid input formatting or ID format.';
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { notFound, errorHandler };
