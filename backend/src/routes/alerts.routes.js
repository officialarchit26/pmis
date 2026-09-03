// Alerts routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { project_id, type, severity, resolved } = req.query;

    let alerts;

    if (isUsingMemoryStore()) {
      alerts = [...memoryStore.alerts];

      if (project_id) {
        alerts = alerts.filter(a => a.project_id === project_id);
      }
      if (type) {
        alerts = alerts.filter(a => a.type === type);
      }
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      if (resolved !== undefined) {
        const isResolved = resolved === 'true';
        alerts = alerts.filter(a => a.is_resolved === isResolved);
      }

      // Add project names
      alerts = alerts.map(a => {
        const project = memoryStore.getProjectById(a.project_id);
        return {
          ...a,
          project_name: project?.name || 'Unknown'
        };
      });
    } else {
      const supabase = getSupabase();
      let query = supabase.from('alerts').select('*');

      if (project_id) query = query.eq('project_id', project_id);
      if (type) query = query.eq('type', type);
      if (severity) query = query.eq('severity', severity);
      if (resolved !== undefined) {
        query = query.eq('is_resolved', resolved === 'true');
      }

      const { data, error } = await query;
      if (error) throw error;
      alerts = data || [];
    }

    res.json({
      success: true,
      data: alerts,
      meta: { total: alerts.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
