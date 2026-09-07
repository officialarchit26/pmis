// Projects routes with RBAC
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');
const { authenticateUser, requireRole, applyScopeFilter } = require('../middleware/auth');

// GET /api/projects - List projects (filtered by role)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { status, department_id, district_id, search } = req.query;
    let projects;

    if (isUsingMemoryStore()) {
      projects = [...memoryStore.projects];

      // Apply role-based filtering
      const user = req.user;
      if (user.role === 'worker' || user.role === 'official') {
        projects = projects.filter(p => p.department_id === user.department_id);
      }
      // admin and senior_official see all

      // Apply query filters
      if (status) projects = projects.filter(p => p.status === status);
      if (department_id) projects = projects.filter(p => p.department_id === department_id);
      if (district_id) projects = projects.filter(p => p.district_id === district_id);
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
      let query = supabase.from('projects').select('*, department:departments(id, name, code), district:districts(id, name, state)');

      // Apply role-based filtering
      query = applyScopeFilter(query, req.user);

      // Apply query filters
      if (status) query = query.eq('status', status);
      if (department_id) query = query.eq('department_id', department_id);
      if (district_id) query = query.eq('district_id', district_id);
      if (search) query = query.ilike('name', `%${search}%`);

      const { data, error } = await query;
      if (error) throw error;
      projects = data || [];
    }

    res.json({
      success: true,
      data: projects,
      meta: { total: projects.length, role: req.user.role }
    });
  } catch (error) {
    console.error('Projects list error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/my-projects - Worker's assigned projects
router.get('/my-projects', authenticateUser, requireRole('worker', 'official', 'senior_official', 'admin'), async (req, res) => {
  try {
    const user = req.user;
    let projects;

    if (isUsingMemoryStore()) {
      if (user.role === 'worker' || user.role === 'official') {
        projects = memoryStore.projects.filter(p => p.department_id === user.department_id);
      } else {
        projects = memoryStore.projects;
      }
      projects = projects.map(p => ({
        ...p,
        department: memoryStore.getDepartmentById(p.department_id),
        district: memoryStore.getDistrictById(p.district_id)
      }));
    } else {
      const supabase = getSupabase();
      let query = supabase.from('projects').select('*, department:departments(id, name, code), district:districts(id, name, state)');
      query = applyScopeFilter(query, user);
      const { data, error } = await query;
      if (error) throw error;
      projects = data || [];
    }

    res.json({ success: true, data: projects, meta: { total: projects.length } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/department - Official's department projects
router.get('/department', authenticateUser, requireRole('official', 'senior_official', 'admin'), async (req, res) => {
  try {
    const { department_id } = req.query;
    let projects;

    if (isUsingMemoryStore()) {
      const filterDept = department_id || req.user.department_id;
      projects = memoryStore.projects.filter(p => p.department_id === filterDept);
      projects = projects.map(p => ({
        ...p,
        department: memoryStore.getDepartmentById(p.department_id),
        district: memoryStore.getDistrictById(p.district_id)
      }));
    } else {
      const supabase = getSupabase();
      const filterDept = department_id || req.user.department_id;
      const { data, error } = await supabase
        .from('projects')
        .select('*, department:departments(id, name, code), district:districts(id, name, state)')
        .eq('department_id', filterDept);
      if (error) throw error;
      projects = data || [];
    }

    res.json({ success: true, data: projects, meta: { total: projects.length } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/all - All projects (senior/admin)
router.get('/all', authenticateUser, requireRole('senior_official', 'admin'), async (req, res) => {
  try {
    let projects;

    if (isUsingMemoryStore()) {
      projects = memoryStore.projects.map(p => ({
        ...p,
        department: memoryStore.getDepartmentById(p.department_id),
        district: memoryStore.getDistrictById(p.district_id)
      }));
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').select('*, department:departments(id, name, code), district:districts(id, name, state)');
      if (error) throw error;
      projects = data || [];
    }

    res.json({ success: true, data: projects, meta: { total: projects.length } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/map-data - Projects with coordinates for map
router.get('/map-data', authenticateUser, async (req, res) => {
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
        .select('*, department:departments(id, name, code), district:districts(id, name, state)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      if (error) throw error;
      projects = data || [];
    }

    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/:id - Single project with details
router.get('/:id', authenticateUser, async (req, res) => {
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
        progress_updates: progressUpdates
      };
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (error) throw error;
      if (!data) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }

      const [deptRes, distRes, mileRes, budgRes, progRes] = await Promise.all([
        data.department_id ? supabase.from('departments').select('*').eq('id', data.department_id).single() : { data: null },
        data.district_id ? supabase.from('districts').select('*').eq('id', data.district_id).single() : { data: null },
        supabase.from('milestones').select('*').eq('project_id', id).order('order_num', { ascending: true }),
        supabase.from('budgets').select('*').eq('project_id', id),
        supabase.from('progress_updates').select('*').eq('project_id', id).order('created_at', { ascending: true }),
      ]);

      project = {
        ...data,
        department: deptRes.data || null,
        district: distRes.data || null,
        milestones: mileRes.data || [],
        budgets: budgRes.data || [],
        progress_updates: progRes.data || []
      };
    }

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/projects - Create project (admin only)
router.post('/', authenticateUser, requireRole('admin', 'senior_official'), async (req, res) => {
  try {
    const projectData = req.body;

    if (isUsingMemoryStore()) {
      const newProject = memoryStore.addProject(projectData);
      res.status(201).json({ success: true, data: newProject });
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').insert([projectData]).select();
      if (error) throw error;
      res.status(201).json({ success: true, data: data[0] });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// PUT /api/projects/:id - Update project (admin or official)
router.put('/:id', authenticateUser, requireRole('admin', 'senior_official', 'official'), async (req, res) => {
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
      res.json({ success: true, data: updated });
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select();
      if (error) throw error;
      res.json({ success: true, data: data[0] });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/projects/:id/progress - Get progress history
router.get('/:id/progress', authenticateUser, async (req, res) => {
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

    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/projects/:id/progress - Add progress update (worker, official)
router.post('/:id/progress', authenticateUser, requireRole('worker', 'official', 'senior_official', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { progress_percent, notes } = req.body;

    if (isUsingMemoryStore()) {
      const update = memoryStore.addProgressUpdate(id, { progress_percent, notes });
      memoryStore.updateProject(id, { progress_percent });
      res.status(201).json({ success: true, data: update });
    } else {
      const supabase = getSupabase();
      const { data: progressData, error: progressError } = await supabase
        .from('progress_updates')
        .insert([{ project_id: id, progress_percent, notes, updated_by: req.user.id }])
        .select();
      if (progressError) throw progressError;

      const { error: projectError } = await supabase
        .from('projects')
        .update({ progress_percent })
        .eq('id', id);
      if (projectError) throw projectError;

      res.status(201).json({ success: true, data: progressData[0] });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

module.exports = router;