// Departments routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

function attachDepartmentStats(dept, projects) {
  const deptProjects = projects.filter(p => p.department_id === dept.id);
  const totalBudget = deptProjects.reduce((sum, p) => sum + Number(p.budget_total || 0), 0);
  const utilizedBudget = deptProjects.reduce((sum, p) => sum + Number(p.budget_utilized || 0), 0);
  const avgProgress =
    deptProjects.length > 0
      ? Math.round((deptProjects.reduce((sum, p) => sum + Number(p.progress_percent || 0), 0) / deptProjects.length) * 10) / 10
      : 0;

  return {
    ...dept,
    project_count: deptProjects.length,
    total_budget: totalBudget,
    utilized_budget: utilizedBudget,
    avg_progress: avgProgress
  };
}

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    let departments;
    let projects;

    if (isUsingMemoryStore()) {
      departments = memoryStore.departments;
      projects = memoryStore.projects;
    } else {
      const supabase = getSupabase();
      const [deptRes, projRes] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('projects').select('*')
      ]);
      if (deptRes.error) throw deptRes.error;
      departments = deptRes.data || [];
      projects = projRes.data || [];
    }

    const data = departments.map(d => attachDepartmentStats(d, projects));

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

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let department;
    let projects;

    if (isUsingMemoryStore()) {
      department = memoryStore.getDepartmentById(id);
      projects = memoryStore.projects;
    } else {
      const supabase = getSupabase();
      const [deptRes, projRes] = await Promise.all([
        supabase.from('departments').select('*').eq('id', id).single(),
        supabase.from('projects').select('*').eq('department_id', id)
      ]);
      if (deptRes.error) throw deptRes.error;
      department = deptRes.data;
      projects = projRes.data || [];
    }

    if (!department) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Department not found' }
      });
    }

    department = attachDepartmentStats(department, projects);

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
