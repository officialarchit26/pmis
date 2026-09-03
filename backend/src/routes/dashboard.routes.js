// Dashboard routes
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    if (isUsingMemoryStore()) {
      // Use in-memory data
      const projects = memoryStore.projects;
      const departments = memoryStore.departments;
      const districts = memoryStore.districts;
      const alerts = memoryStore.alerts;

      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const delayedProjects = projects.filter(p => p.status === 'delayed').length;
      const atRiskProjects = projects.filter(p => p.risk_score >= 60).length;
      const totalBudget = projects.reduce((sum, p) => sum + p.budget_total, 0);
      const utilizedBudget = projects.reduce((sum, p) => sum + p.budget_utilized, 0);
      const avgProgress =
        projects.reduce((sum, p) => sum + p.progress_percent, 0) / projects.length;

      res.json({
        success: true,
        data: {
          kpis: {
            total_projects: totalProjects,
            active_projects: activeProjects,
            completed_projects: completedProjects,
            delayed_projects: delayedProjects,
            at_risk_projects: atRiskProjects,
            total_budget: totalBudget,
            utilized_budget: utilizedBudget,
            utilization_percent: totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0,
            average_progress: Math.round(avgProgress * 10) / 10
          },
          projects_by_department: departments.map(dept => {
            const deptProjects = projects.filter(p => p.department_id === dept.id);
            return {
              department_id: dept.id,
              department_name: dept.name,
              project_count: deptProjects.length,
              total_budget: deptProjects.reduce((s, p) => s + p.budget_total, 0),
              utilized_budget: deptProjects.reduce((s, p) => s + p.budget_utilized, 0),
              avg_progress:
                deptProjects.length > 0
                  ? Math.round(
                      (deptProjects.reduce((s, p) => s + p.progress_percent, 0) /
                        deptProjects.length) *
                        10
                    ) / 10
                  : 0
            };
          }),
          projects_by_district: districts.map(dist => {
            const distProjects = projects.filter(p => p.district_id === dist.id);
            return {
              district_id: dist.id,
              district_name: dist.name,
              state: dist.state,
              project_count: distProjects.length,
              total_budget: distProjects.reduce((s, p) => s + p.budget_total, 0),
              avg_progress:
                distProjects.length > 0
                  ? Math.round(
                      (distProjects.reduce((s, p) => s + p.progress_percent, 0) /
                        distProjects.length) *
                        10
                    ) / 10
                  : 0
            };
          }),
          projects_by_status: ['planning', 'active', 'on_hold', 'completed', 'delayed', 'cancelled'].map(
            status => ({
              status,
              count: projects.filter(p => p.status === status).length
            })
          ),
          recent_projects: [...projects]
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5),
          critical_projects: projects
            .filter(p => p.risk_score >= 60 || p.status === 'delayed')
            .sort((a, b) => b.risk_score - a.risk_score)
            .slice(0, 5),
          upcoming_deadlines: [...projects]
            .filter(p => p.status !== 'completed' && p.end_date)
            .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
            .slice(0, 5)
            .map(p => {
              const daysRemaining = Math.ceil(
                (new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24)
              );
              return { ...p, days_remaining: daysRemaining };
            }),
          active_alerts: alerts.filter(a => !a.is_resolved).length
        }
      });
    } else {
      // Use Supabase
      const supabase = getSupabase();
      const { data: projects } = await supabase.from('projects').select('*');
      const { data: departments } = await supabase.from('departments').select('*');
      const { data: districts } = await supabase.from('districts').select('*');
      const { data: alerts } = await supabase.from('alerts').select('*').eq('is_resolved', false);

      res.json({
        success: true,
        data: {
          // Same structure as memory store
          kpis: {
            total_projects: projects?.length || 0,
            active_projects: projects?.filter(p => p.status === 'active').length || 0,
            completed_projects: projects?.filter(p => p.status === 'completed').length || 0
          }
        }
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
