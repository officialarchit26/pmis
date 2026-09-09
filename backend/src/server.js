// Project Pulse - Backend Server
// Complete MVP Implementation

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : true,
  credentials: true
}));
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const projectsRoutes = require('./routes/projects.routes');
const departmentsRoutes = require('./routes/departments.routes');
const districtsRoutes = require('./routes/districts.routes');
const alertsRoutes = require('./routes/alerts.routes');
const aiRoutes = require('./routes/ai.routes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Project Pulse API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('===========================================');
  console.log('  Project Pulse Backend');
  console.log('  Running on port', PORT);
  console.log('===========================================');
  console.log('  Health:      http://localhost:' + PORT + '/api/health');
  console.log('  Dashboard:   http://localhost:' + PORT + '/api/dashboard/summary');
  console.log('  Projects:    http://localhost:' + PORT + '/api/projects');
  console.log('  Departments: http://localhost:' + PORT + '/api/departments');
  console.log('  Districts:   http://localhost:' + PORT + '/api/districts');
  console.log('  AI:         http://localhost:' + PORT + '/api/ai/assistant');
  console.log('===========================================');
});

module.exports = app;
