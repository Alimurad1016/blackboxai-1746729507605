const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const brandRoutes = require('./brandRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/brands', brandRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

module.exports = router;
