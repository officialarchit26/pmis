// Districts routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

function attachDistrictStats(dist, projects) {
  const distProjects = projects.filter(p => p.district_id === dist.id);
  const totalBudget = distProjects.reduce((sum, p) => sum + Number(p.budget_total || 0), 0);
  const utilizedBudget = distProjects.reduce((sum, p) => sum + Number(p.budget_utilized || 0), 0);
  const avgProgress =
    distProjects.length > 0
      ? Math.round((distProjects.reduce((sum, p) => sum + Number(p.progress_percent || 0), 0) / distProjects.length) * 10) / 10
      : 0;

  return {
    ...dist,
    project_count: distProjects.length,
    total_budget: totalBudget,
    utilized_budget: utilizedBudget,
    avg_progress: avgProgress
  };
}

// GET /api/districts
router.get('/', async (req, res) => {
  try {
    let districts;
    let projects;

    if (isUsingMemoryStore()) {
      districts = memoryStore.districts;
      projects = memoryStore.projects;
    } else {
      const supabase = getSupabase();
      const [distRes, projRes] = await Promise.all([
        supabase.from('districts').select('*'),
        supabase.from('projects').select('*')
      ]);
      if (distRes.error) throw distRes.error;
      districts = distRes.data || [];
      projects = projRes.data || [];
    }

    const data = districts.map(d => attachDistrictStats(d, projects));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
