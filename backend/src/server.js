// Project Pulse - Backend Server
// Phase 1: Basic Express setup with /api/health endpoint

// Load environment variables
require('dotenv').config();

const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'project-pulse-backend'
  });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Project Pulse Backend running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
});
