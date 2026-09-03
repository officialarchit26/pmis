// Departments routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    let departments;

    if (isUsingMemoryStore()) {
      departments = memoryStore.departments;
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      departments = data || [];
    }

    res.json({
      success: true,
      data: departments
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

    if (isUsingMemoryStore()) {
      department = memoryStore.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Department not found' }
        });
      }

      // Add project count
      const projects = memoryStore.projects.filter(p => p.department_id === id);
      department = {
        ...department,
        project_count: projects.length,
        total_budget: projects.reduce((sum, p) => sum + p.budget_total, 0)
      };
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('departments').select('*').eq('id', id).single();
      if (error) throw error;
      department = data;
    }

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
