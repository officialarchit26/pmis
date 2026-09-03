// Projects routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// GET /api/projects - List all projects
router.get('/', async (req, res) => {
  try {
    const { status, department_id, district_id, search } = req.query;

    let projects;

    if (isUsingMemoryStore()) {
      projects = [...memoryStore.projects];

      // Apply filters
      if (status) {
        projects = projects.filter(p => p.status === status);
      }
      if (department_id) {
        projects = projects.filter(p => p.department_id === department_id);
      }
      if (district_id) {
        projects = projects.filter(p => p.district_id === district_id);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        projects = projects.filter(
          p =>
            p.name.toLowerCase().includes(searchLower) ||
            (p.description && p.description.toLowerCase().includes(searchLower))
        );
      }

      // Add department and district names
      projects = projects.map(p => ({
        ...p,
        department: memoryStore.getDepartmentById(p.department_id),
        district: memoryStore.getDistrictById(p.district_id)
      }));
    } else {
      const supabase = getSupabase();
      let query = supabase.from('projects').select('*');

      if (status) query = query.eq('status', status);
      if (department_id) query = query.eq('department_id', department_id);
      if (district_id) query = query.eq('district_id', district_id);

      const { data, error } = await query;
      if (error) throw error;
      projects = data || [];
    }

    res.json({
      success: true,
      data: projects,
      meta: {
        total: projects.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/map-data - Projects with coordinates for map
router.get('/map-data', async (req, res) => {
  try {
    let projects;

    if (isUsingMemoryStore()) {
      projects = memoryStore.projects
        .filter(p => p.latitude && p.longitude)
        .map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          progress_percent: p.progress_percent,
          risk_score: p.risk_score,
          latitude: p.latitude,
          longitude: p.longitude,
          department: memoryStore.getDepartmentById(p.department_id),
          district: memoryStore.getDistrictById(p.district_id)
        }));
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) throw error;
      projects = data || [];
    }

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/:id - Single project with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let project;

    if (isUsingMemoryStore()) {
      project = memoryStore.getProjectById(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }

      // Add related data
      const milestones = memoryStore.getMilestonesByProject(id);
      const budgets = memoryStore.getBudgetsByProject(id);
      const progressUpdates = memoryStore.getProgressByProject(id);
      const department = memoryStore.getDepartmentById(project.department_id);
      const district = memoryStore.getDistrictById(project.district_id);

      project = {
        ...project,
        department,
        district,
        milestones,
        budgets,
        progressUpdates
      };
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      project = data;

      if (!project) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/projects - Create project
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;

    if (isUsingMemoryStore()) {
      const newProject = memoryStore.addProject(projectData);
      res.status(201).json({
        success: true,
        data: newProject
      });
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').insert([projectData]).select();
      if (error) throw error;
      res.status(201).json({
        success: true,
        data: data[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isUsingMemoryStore()) {
      const updated = memoryStore.updateProject(id, updates);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }
      res.json({
        success: true,
        data: updated
      });
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      res.json({
        success: true,
        data: data[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/:id/progress - Get progress history
router.get('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    let progress;

    if (isUsingMemoryStore()) {
      progress = memoryStore.getProgressByProject(id);
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('progress_updates')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      progress = data || [];
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/projects/:id/progress - Add progress update
router.post('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percent, notes } = req.body;

    if (isUsingMemoryStore()) {
      const update = memoryStore.addProgressUpdate(id, { progress_percent, notes });

      // Also update the project progress
      memoryStore.updateProject(id, { progress_percent });

      res.status(201).json({
        success: true,
        data: update
      });
    } else {
      const supabase = getSupabase();

      // Add progress update
      const { data: progressData, error: progressError } = await supabase
        .from('progress_updates')
        .insert([{ project_id: id, progress_percent, notes }])
        .select();
      if (progressError) throw progressError;

      // Update project progress
      const { error: projectError } = await supabase
        .from('projects')
        .update({ progress_percent })
        .eq('id', id);
      if (projectError) throw projectError;

      res.status(201).json({
        success: true,
        data: progressData[0]
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;
