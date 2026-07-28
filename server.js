
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize the Express application
const app = express();

// Enable Cross-Origin Resource Sharing (CORS) so the React client can make requests to this server
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
  credentials: true
}));

// Body parser middleware to process JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists and serve it statically
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Test route to ensure server is operational
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Leave Management System Backend API is active' });
});

// Mount modular routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Middleware to handle unmatched route routes (404 Error handler)
app.use(notFound);

// Custom error handling middleware to catch exceptions and send JSON responses
app.use(errorHandler);

// Start Express server listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
