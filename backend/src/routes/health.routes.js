// Health check routes
const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/database');

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'project-pulse-backend',
      timestamp: new Date().toISOString()
    }
  });
});

// Full health check with database
router.get('/health/full', async (req, res) => {
  let dbStatus = 'not_configured';

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('departments').select('id').limit(1);
      dbStatus = error ? 'error' : 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'project-pulse-backend',
      timestamp: new Date().toISOString(),
      database: {
        provider: 'Supabase',
        status: dbStatus
      },
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

module.exports = router;
