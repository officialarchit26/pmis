// AI routes - Risk analysis, assistant, and report generation
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// Risk analysis service
const { calculateRiskScore } = require('../services/riskService');

// Gemini service
const { askGemini, generateAIReport } = require('../services/geminiService');

// GET /api/ai/risk-analysis/:projectId
router.get('/risk-analysis/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    let project;

    if (isUsingMemoryStore()) {
      project = memoryStore.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }

      // Get related data
      const milestones = memoryStore.getMilestonesByProject(projectId);
      const budgets = memoryStore.getBudgetsByProject(projectId);

      project = {
        ...project,
        milestones,
        budgets
      };
    } else {
      const supabase = getSupabase();
      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .select('*, department:departments(name), district:districts(name)')
        .eq('id', projectId)
        .single();
      if (projErr || !projectData) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }
      const { data: milestonesData } = await supabase.from('milestones').select('*').eq('project_id', projectId);
      const { data: budgetsData } = await supabase.from('budgets').select('*').eq('project_id', projectId);
      project = {
        ...projectData,
        milestones: milestonesData || [],
        budgets: budgetsData || []
      };
    }

    // Calculate risk analysis
    const riskAnalysis = calculateRiskScore(project);

    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// POST /api/ai/assistant
router.post('/assistant', async (req, res) => {
  try {
    const { message, project_id } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' }
      });
    }

    // Build context from project data
    let context = '';

    if (project_id) {
      if (isUsingMemoryStore()) {
        const project = memoryStore.getProjectById(project_id);
        if (project) {
          context = buildProjectContext(project, project_id);
        }
      } else {
        const supabase = getSupabase();
        const { data: project } = await supabase
          .from('projects')
          .select('*, department:departments(name), district:districts(name)')
          .eq('id', project_id)
          .single();
        if (project) {
          const { data: milestones } = await supabase.from('milestones').select('*').eq('project_id', project_id);
          const { data: budgets } = await supabase.from('budgets').select('*').eq('project_id', project_id);
          project.milestones = milestones || [];
          project.budgets = budgets || [];
          context = buildProjectContextForDatabase(project);
        }
      }
    }

    // General context if no project specified
    if (!context) {
      let projects = [];
      if (isUsingMemoryStore()) {
        projects = memoryStore.projects;
      } else {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('projects')
          .select('*, department:departments(name), district:districts(name)');
        projects = data || [];
      }

      if (projects.length === 0) {
        context = 'No projects available in the system.';
      } else {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'active').length;
        const delayed = projects.filter(p => p.status === 'delayed');
        const atRisk = projects.filter(p => (p.risk_score || 0) >= 60);
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget_total || 0), 0);
        const utilizedBudget = projects.reduce((sum, p) => sum + (p.budget_utilized || 0), 0);

        context = `PMIS System Ground-Truth Data:\n`;
        context += `- Total Projects: ${total}\n`;
        context += `- Active Projects: ${active}\n`;
        context += `- Delayed Projects (${delayed.length}): ${delayed.map(p => `${p.name} (${p.progress_percent}% progress, budget $${(p.budget_total || 0).toLocaleString()})`).join('; ') || 'None'}\n`;
        context += `- High Risk Projects (${atRisk.length}): ${atRisk.map(p => `${p.name} (Risk ${p.risk_score}/100, status: ${p.status})`).join('; ') || 'None'}\n`;
        context += `- Total System Budget: $${totalBudget.toLocaleString()}\n`;
        context += `- Utilized Budget: $${utilizedBudget.toLocaleString()} (${totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0}%)\n`;
        context += `- All Projects Summary:\n` + projects.slice(0, 10).map(p => `  * ${p.name}: status=${p.status}, progress=${p.progress_percent}%, risk=${p.risk_score}/100, dept=${p.department?.name || 'General'}`).join('\n');
      }
    }

    // Try Gemini if configured, otherwise use fallback
    let response;

    if (process.env.GEMINI_API_KEY && context) {
      try {
        response = await askGemini(message, context);
      } catch (geminiErr) {
        console.error('Gemini API error, using fallback:', geminiErr.message);
        response = generateFallbackResponse(message, context);
      }
    } else {
      response = generateFallbackResponse(message, context);
    }

    res.json({
      success: true,
      data: {
        response,
        project_id: project_id || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// Helper to build context from in-memory project
function buildProjectContext(project, projectId) {
  let context = `Project: ${project.name}\n`;
  context += `Status: ${project.status}\n`;
  context += `Progress: ${project.progress_percent}%\n`;
  context += `Budget: $${project.budget_total.toLocaleString()} / $${project.budget_utilized.toLocaleString()}\n`;
  context += `Risk Score: ${project.risk_score}/100\n`;

  const milestones = memoryStore.getMilestonesByProject(projectId);
  if (milestones.length > 0) {
    context += '\nMilestones:\n';
    milestones.forEach(m => {
      context += `- ${m.title}: ${m.status} (due: ${m.due_date})\n`;
    });
  }
  return context;
}

// Helper to build context from database project
function buildProjectContextForDatabase(project) {
  let context = `Project: ${project.name}\n`;
  context += `Status: ${project.status}\n`;
  context += `Progress: ${project.progress_percent || 0}%\n`;
  context += `Budget: $${(project.budget_total || 0).toLocaleString()} / $${(project.budget_utilized || 0).toLocaleString()}\n`;
  context += `Risk Score: ${project.risk_score || 0}/100\n`;

  if (project.milestones && project.milestones.length > 0) {
    context += '\nMilestones:\n';
    project.milestones.forEach(m => {
      context += `- ${m.title}: ${m.status} (due: ${m.due_date})\n`;
    });
  }
  return context;
}

// Fallback response generator
function generateFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();
  const projects = isUsingMemoryStore() ? memoryStore.projects : [];

  // Check for specific question patterns
  if (lowerMessage.includes('delayed') || lowerMessage.includes('delay')) {
    const delayed = projects.filter(p => p.status === 'delayed');
    if (delayed.length === 0) {
      return 'There are no delayed projects at the moment. All projects are on schedule!';
    }
    return `There are ${delayed.length} delayed project(s):\n` +
      delayed.map(p => `- ${p.name} (${p.progress_percent || 0}% complete)`).join('\n');
  }

  if (lowerMessage.includes('at risk') || lowerMessage.includes('risk')) {
    const atRisk = projects.filter(p => (p.risk_score || 0) >= 60);
    if (atRisk.length === 0) {
      return 'No projects are currently at high risk. All projects have acceptable risk levels.';
    }
    return `There are ${atRisk.length} project(s) at risk (score ≥60):\n` +
      atRisk.map(p => `- ${p.name}: Risk Score ${p.risk_score || 0}/100`).join('\n');
  }

  if (lowerMessage.includes('deadline') || lowerMessage.includes('upcoming')) {
    const upcoming = [...projects]
      .filter(p => p.status !== 'completed' && p.end_date)
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
      .slice(0, 5);

    if (upcoming.length === 0) {
      return 'No upcoming deadlines found.';
    }
    return 'Upcoming project deadlines:\n' +
      upcoming.map(p => {
        const days = Math.ceil((new Date(p.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        return `- ${p.name}: ${p.end_date} (${days > 0 ? days + ' days remaining' : 'OVERDUE'})`;
      }).join('\n');
  }

  if (lowerMessage.includes('budget')) {
    const total = projects.reduce((sum, p) => sum + (p.budget_total || 0), 0);
    const utilized = projects.reduce((sum, p) => sum + (p.budget_utilized || 0), 0);
    const percent = total > 0 ? Math.round((utilized / total) * 100) : 0;

    return `Budget Overview:\n` +
      `- Total Budget: $${total.toLocaleString()}\n` +
      `- Utilized: $${utilized.toLocaleString()}\n` +
      `- Utilization Rate: ${percent}%\n` +
      `- Remaining: $${(total - utilized).toLocaleString()}`;
  }

  if (lowerMessage.includes('progress') && lowerMessage.includes('department')) {
    const departments = isUsingMemoryStore() ? memoryStore.departments : [];
    const deptStats = departments.map(dept => {
      const deptProjects = projects.filter(p => p.department_id === dept.id);
      const avgProgress = deptProjects.length > 0
        ? Math.round(deptProjects.reduce((s, p) => s + (p.progress_percent || 0), 0) / deptProjects.length)
        : 0;
      return { name: dept.name || dept.name, progress: avgProgress, count: deptProjects.length };
    }).sort((a, b) => b.progress - a.progress);

    return 'Department Progress Rankings:\n' +
      deptStats.map((d, i) => `${i + 1}. ${d.name}: ${d.progress}% (${d.count} projects)`).join('\n');
  }

  // Default response
  return `I understand you're asking about: "${message}"\n\n` +
    `I can help with questions about:\n` +
    `- Project delays and status\n` +
    `- Risk analysis\n` +
    `- Budget information\n` +
    `- Upcoming deadlines\n` +
    `- Department progress\n\n` +
    `Please ask a more specific question, or provide a project ID for detailed analysis.`;
}

// Generate report content
function generateReport(project, riskAnalysis, reportType) {
  const now = new Date();
  const endDate = new Date(project.end_date);
  const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const milestones = project.milestones || [];
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;

  const budgetTotal = project.budget_total || 0;
  const budgetUtilized = project.budget_utilized || 0;
  const budgetPercent = budgetTotal > 0 ? Math.round((budgetUtilized / budgetTotal) * 100) : 0;

  const report = {
    id: `report-${Date.now()}`,
    project_id: project.id,
    report_type: reportType,
    generated_at: now.toISOString(),
    content: {
      title: `${project.name} - Project Report`,
      executive_summary: {
        status: project.status,
        overall_progress: `${project.progress_percent || 0}%`,
        budget_status: `${budgetPercent}% utilized`,
        risk_level: riskAnalysis.riskLevel,
        days_remaining: daysRemaining > 0 ? daysRemaining : 0,
        milestones_completed: `${completedMilestones}/${totalMilestones}`
      },
      sections: [
        {
          heading: 'Project Overview',
          content: `${project.name} is a ${project.priority || 'medium'} priority project under ${project.department?.name || 'the relevant department'}. ` +
            `The project is currently ${project.status || 'unknown'} with ${(project.progress_percent || 0)}% physical progress completed.`
        },
        {
          heading: 'Financial Status',
          content: `Total allocated budget: $${budgetTotal.toLocaleString()}\n` +
            `Amount utilized: $${budgetUtilized.toLocaleString()}\n` +
            `Remaining budget: $${(budgetTotal - budgetUtilized).toLocaleString()}\n` +
            `Utilization rate: ${budgetPercent}%`
        },
        {
          heading: 'Timeline',
          content: `Start Date: ${project.start_date || 'Not set'}\n` +
            `End Date: ${project.end_date || 'Not set'}\n` +
            `Days Remaining: ${daysRemaining > 0 ? daysRemaining : 'OVERDUE'}\n` +
            `On Track: ${project.progress_percent >= calculateExpectedProgress(project) ? 'Yes' : 'No - Behind Schedule'}`
        },
        {
          heading: 'Milestones',
          content: totalMilestones > 0
            ? milestones.map(m => {
                const status = m.status || 'pending';
                const completedAt = m.completed_at ? new Date(m.completed_at).toLocaleDateString() : 'N/A';
                return `- ${m.title}: ${status} ${status === 'completed' ? `(completed: ${completedAt})` : `(due: ${m.due_date || 'No due date'})`}`;
              }).join('\n')
            : 'No milestones recorded'
        },
        {
          heading: 'Risk Assessment',
          content: `Risk Score: ${riskAnalysis.riskScore}/100 (${riskAnalysis.riskLevel})\n\n` +
            `Key Factors:\n` +
            riskAnalysis.factors.map(r => `- ${r}`).join('\n') +
            `\n\nRecommendations:\n` +
            riskAnalysis.recommendations.map(r => `- ${r}`).join('\n')
        }
      ],
      summary: `Project "${project.name}" is currently at ${(project.progress_percent || 0)}% completion with ` +
        `${budgetPercent}% of the budget utilized. ` +
        `The risk level is assessed as ${riskAnalysis.riskLevel} with ${riskAnalysis.factors.length} key factors identified.`,
      recommendations: riskAnalysis.recommendations
    }
  };

  return report;
}

// Calculate expected progress based on time elapsed
function calculateExpectedProgress(project) {
  if (!project.start_date || !project.end_date) return 50;

  const start = new Date(project.start_date);
  const end = new Date(project.end_date);
  const now = new Date();

  const totalDuration = end - start;
  const elapsed = now - start;

  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;

  return Math.round((elapsed / totalDuration) * 100);
}

// POST /api/ai/report/:projectId - Generate full AI intelligence report
router.post('/report/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { report_type = 'full' } = req.body;
    let project;

    if (isUsingMemoryStore()) {
      project = memoryStore.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      project.milestones = memoryStore.getMilestonesByProject(projectId);
      project.budgets = memoryStore.getBudgetsByProject(projectId);
      project.department = memoryStore.getDepartmentById(project.department_id);
      project.district = memoryStore.getDistrictById(project.district_id);
    } else {
      const supabase = getSupabase();
      const { data: projectData, error: projErr } = await supabase
        .from('projects')
        .select('*, department:departments(name), district:districts(name)')
        .eq('id', projectId)
        .single();
      if (projErr || !projectData) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
      }
      const { data: milestonesData } = await supabase.from('milestones').select('*').eq('project_id', projectId);
      const { data: budgetsData } = await supabase.from('budgets').select('*').eq('project_id', projectId);
      project = {
        ...projectData,
        milestones: milestonesData || [],
        budgets: budgetsData || []
      };
    }

    const riskAnalysis = calculateRiskScore(project);
    const reportData = await generateAIReport(project, riskAnalysis, report_type);

    // Save report in Supabase if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('reports').insert([{
          project_id: projectId,
          ai_generated_title: reportData.title,
          ai_generated_content: reportData,
          report_type: report_type
        }]);
      } catch (saveErr) {
        console.warn('Could not persist report to database:', saveErr.message);
      }
    }

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// GET /api/ai/reports - List recent reports
router.get('/reports', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(20);
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

// GET /api/ai/reports/:projectId - Get latest reports for project
router.get('/reports/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('generated_at', { ascending: false })
        .limit(5);
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

module.exports = router;
