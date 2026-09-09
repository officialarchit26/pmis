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
    let selectedProject = null;
    let allProjects = [];

    if (project_id) {
      if (isUsingMemoryStore()) {
        const project = memoryStore.getProjectById(project_id);
        if (project) {
          selectedProject = project;
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
          selectedProject = project;
          context = buildProjectContextForDatabase(project);
        }
      }
    }

    // General context if no project specified
    if (!context) {
      if (isUsingMemoryStore()) {
        allProjects = memoryStore.projects;
      } else {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('projects')
          .select('*, department:departments(name), district:districts(name)');
        allProjects = data || [];
      }

      if (allProjects.length === 0) {
        context = 'No projects available in the system.';
      } else {
        const total = allProjects.length;
        const active = allProjects.filter(p => p.status === 'active').length;
        const delayed = allProjects.filter(p => p.status === 'delayed');
        const atRisk = allProjects.filter(p => Number(p.risk_score || 0) >= 60 || p.status === 'delayed');
        const totalBudget = allProjects.reduce((sum, p) => sum + Number(p.budget_total || 0), 0);
        const utilizedBudget = allProjects.reduce((sum, p) => sum + Number(p.budget_utilized || 0), 0);

        context = `PMIS System Ground-Truth Data:\n`;
        context += `- Total Projects: ${total}\n`;
        context += `- Active Projects: ${active}\n`;
        context += `- Delayed Projects (${delayed.length}): ${delayed.map(p => `${p.name} (${p.progress_percent}% progress, budget $${Number(p.budget_total || 0).toLocaleString()})`).join('; ') || 'None'}\n`;
        context += `- High Risk Projects (${atRisk.length}): ${atRisk.map(p => `${p.name} (Risk ${p.risk_score}/100, status: ${p.status})`).join('; ') || 'None'}\n`;
        context += `- Total System Budget: $${totalBudget.toLocaleString()}\n`;
        context += `- Utilized Budget: $${utilizedBudget.toLocaleString()} (${totalBudget > 0 ? Math.round((utilizedBudget / totalBudget) * 100) : 0}%)\n`;
        context += `- All Projects Summary:\n` + allProjects.slice(0, 10).map(p => `  * ${p.name}: status=${p.status}, progress=${p.progress_percent}%, risk=${p.risk_score}/100, dept=${p.department?.name || 'General'}`).join('\n');
      }
    }

    // Try Gemini if configured, otherwise use fallback
    let response;

    if (process.env.GEMINI_API_KEY && context) {
      try {
        response = await askGemini(message, context);
      } catch (geminiErr) {
        console.error('Gemini API error, using fallback:', geminiErr.message);
        response = generateFallbackResponse(message, context, allProjects, selectedProject);
      }
    } else {
      response = generateFallbackResponse(message, context, allProjects, selectedProject);
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
  context += `Budget: $${Number(project.budget_total || 0).toLocaleString()} / $${Number(project.budget_utilized || 0).toLocaleString()}\n`;
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
  context += `Budget: $${Number(project.budget_total || 0).toLocaleString()} / $${Number(project.budget_utilized || 0).toLocaleString()}\n`;
  context += `Risk Score: ${project.risk_score || 0}/100\n`;

  if (project.milestones && project.milestones.length > 0) {
    context += '\nMilestones:\n';
    project.milestones.forEach(m => {
      context += `- ${m.title}: ${m.status} (due: ${m.due_date})\n`;
    });
  }
  return context;
}

// Fallback response generator grounded in real project data
function generateFallbackResponse(message, context, allProjects = [], selectedProject = null) {
  const lowerMessage = message.toLowerCase();
  const projects = allProjects && allProjects.length > 0
    ? allProjects
    : (isUsingMemoryStore() ? memoryStore.projects : []);

  // If asking about a specific project
  if (selectedProject) {
    const p = selectedProject;
    const total = Number(p.budget_total || 0);
    const utilized = Number(p.budget_utilized || 0);
    const percent = total > 0 ? Math.round((utilized / total) * 100) : 0;

    if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return `Budget Analysis for "${p.name}":\n` +
        `- Total Allocated: $${total.toLocaleString()}\n` +
        `- Amount Utilized: $${utilized.toLocaleString()} (${percent}%)\n` +
        `- Remaining: $${(total - utilized).toLocaleString()}\n` +
        `- Financial Status: ${percent > 90 ? 'High budget drawdown' : 'Within budget parameters'}`;
    }

    if (lowerMessage.includes('risk') || lowerMessage.includes('factor')) {
      const riskLevel = p.risk_score <= 25 ? 'LOW' : p.risk_score <= 50 ? 'MEDIUM' : p.risk_score <= 75 ? 'HIGH' : 'CRITICAL';
      return `Risk Assessment for "${p.name}":\n` +
        `- Current Risk Score: ${p.risk_score || 0}/100\n` +
        `- Evaluated Level: ${riskLevel} RISK\n` +
        `- Current Status: ${p.status}\n` +
        `- Physical Progress: ${p.progress_percent || 0}%`;
    }

    if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule') || lowerMessage.includes('deadline') || lowerMessage.includes('milestone')) {
      const milestones = p.milestones || [];
      return `Timeline & Milestones for "${p.name}":\n` +
        `- Timeline: ${p.start_date || 'N/A'} to ${p.end_date || 'N/A'}\n` +
        `- Status: ${p.status}\n` +
        `- Physical Progress: ${p.progress_percent || 0}%\n` +
        (milestones.length > 0
          ? `- Milestones (${milestones.length}):\n` + milestones.map(m => `  * ${m.title}: ${m.status} (due: ${m.due_date})`).join('\n')
          : '- No milestones recorded');
    }

    return `Project Summary for "${p.name}":\n` +
      `- Status: ${p.status}\n` +
      `- Physical Progress: ${p.progress_percent || 0}%\n` +
      `- Budget: $${total.toLocaleString()} ($${utilized.toLocaleString()} utilized - ${percent}%)\n` +
      `- Risk Score: ${p.risk_score || 0}/100\n` +
      `- Department: ${p.department?.name || 'N/A'}\n` +
      `- District: ${p.district?.name || 'N/A'}`;
  }

  // System-wide queries
  if (lowerMessage.includes('delayed') || lowerMessage.includes('delay')) {
    const delayed = projects.filter(p => p.status === 'delayed');
    if (delayed.length === 0) {
      return 'There are no delayed projects at the moment. All projects are on schedule!';
    }
    return `There is ${delayed.length} delayed project(s):\n` +
      delayed.map(p => `- ${p.name}: ${p.progress_percent || 0}% complete, budget $${Number(p.budget_total || 0).toLocaleString()} (Risk: ${p.risk_score || 0}/100)`).join('\n');
  }

  if (lowerMessage.includes('at risk') || lowerMessage.includes('risk') || lowerMessage.includes('highest risk')) {
    const atRisk = projects.filter(p => Number(p.risk_score || 0) >= 60 || p.status === 'delayed');
    if (atRisk.length === 0) {
      return 'No projects are currently at high risk. All projects have acceptable risk levels.';
    }
    return `There are ${atRisk.length} project(s) at risk (score ≥60 or delayed):\n` +
      atRisk.map(p => `- ${p.name}: Risk Score ${p.risk_score || 0}/100 (Status: ${p.status}, Progress: ${p.progress_percent || 0}%)`).join('\n');
  }

  if (lowerMessage.includes('ongoing') || lowerMessage.includes('active')) {
    const active = projects.filter(p => p.status === 'active');
    return `There are ${active.length} ongoing (active) projects in the PMIS database, with an average progress of ${
      active.length > 0 ? Math.round((active.reduce((s, p) => s + Number(p.progress_percent || 0), 0) / active.length) * 10) / 10 : 0
    }%.`;
  }

  if (lowerMessage.includes('completed')) {
    const completed = projects.filter(p => p.status === 'completed');
    if (completed.length === 0) {
      return 'No projects have been completed yet.';
    }
    return `There is ${completed.length} completed project(s):\n` +
      completed.map(p => `- ${p.name}: 100% progress, final budget $${Number(p.budget_utilized || 0).toLocaleString()} of $${Number(p.budget_total || 0).toLocaleString()}`).join('\n');
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
    const total = projects.reduce((sum, p) => sum + Number(p.budget_total || 0), 0);
    const utilized = projects.reduce((sum, p) => sum + Number(p.budget_utilized || 0), 0);
    const percent = total > 0 ? Math.round((utilized / total) * 100) : 0;

    return `System-wide Budget Overview:\n` +
      `- Total Budget: $${total.toLocaleString()}\n` +
      `- Utilized: $${utilized.toLocaleString()}\n` +
      `- Utilization Rate: ${percent}%\n` +
      `- Remaining: $${(total - utilized).toLocaleString()}`;
  }

  if (lowerMessage.includes('progress') && lowerMessage.includes('department')) {
    const deptMap = {};
    projects.forEach(p => {
      const dName = p.department?.name || 'General';
      if (!deptMap[dName]) deptMap[dName] = { name: dName, totalProg: 0, count: 0 };
      deptMap[dName].totalProg += Number(p.progress_percent || 0);
      deptMap[dName].count += 1;
    });
    const deptStats = Object.values(deptMap).map(d => ({
      name: d.name,
      progress: d.count > 0 ? Math.round((d.totalProg / d.count) * 10) / 10 : 0,
      count: d.count
    })).sort((a, b) => b.progress - a.progress);

    return 'Department Progress Rankings:\n' +
      deptStats.map((d, i) => `${i + 1}. ${d.name}: ${d.progress}% (${d.count} projects)`).join('\n');
  }

  // Default response
  return `I understand you're asking about: "${message}"\n\n` +
    `I can help with questions about:\n` +
    `- Project delays and status (e.g. "Which projects are delayed?")\n` +
    `- Risk analysis (e.g. "Which projects have highest risk?")\n` +
    `- Budget information (e.g. "Give me a budget summary")\n` +
    `- Ongoing or completed projects\n` +
    `- Upcoming deadlines\n` +
    `- Department performance\n\n` +
    `Please ask a specific question or specify a project for targeted intelligence.`;
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
