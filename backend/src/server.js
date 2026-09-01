// Project Pulse - Backend Server
// Node.js + Express API

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', healthRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log('✓ Project Pulse Backend running on port', PORT);
  console.log('  Health check: http://localhost:' + PORT + '/api/health');
  console.log('  Full health: http://localhost:' + PORT + '/api/health/full');
});
