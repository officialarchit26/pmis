// Health check routes
const express = require('express');
const { testConnection } = require('../config/supabase');

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'project-pulse-backend',
    timestamp: new Date().toISOString(),
  });
});

// Detailed health check (includes database connection)
router.get('/health/full', async (req, res) => {
  const dbStatus = await testConnection();

  res.json({
    status: 'ok',
    service: 'project-pulse-backend',
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Supabase',
      connected: dbStatus.connected,
      reason: dbStatus.reason || null,
    },
  });
});

module.exports = router;
