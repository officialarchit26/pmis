// AI routes - Risk analysis, assistant, and report generation
const express = require('express');
const router = express.Router();
const { getSupabase, isUsingMemoryStore, memoryStore } = require('../config/database');

// Risk analysis service
const { calculateRiskScore } = require('../services/riskService');

// Gemini service
const { askGemini } = require('../services/geminiService');

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
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      project = data;
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

    if (project_id && isUsingMemoryStore()) {
      const project = memoryStore.getProjectById(project_id);
      if (project) {
        context = `Project: ${project.name}\n`;
        context += `Status: ${project.status}\n`;
        context += `Progress: ${project.progress_percent}%\n`;
        context += `Budget: $${project.budget_total.toLocaleString()} / $${project.budget_utilized.toLocaleString()}\n`;
        context += `Risk Score: ${project.risk_score}/100\n`;

        const milestones = memoryStore.getMilestonesByProject(project_id);
        if (milestones.length > 0) {
          context += '\nMilestones:\n';
          milestones.forEach(m => {
            context += `- ${m.title}: ${m.status} (due: ${m.due_date})\n`;
          });
        }
      }
    } else if (!project_id) {
      // General context - provide overview
      const projects = memoryStore.projects;
      const total = projects.length;
      const active = projects.filter(p => p.status === 'active').length;
      const delayed = projects.filter(p => p.status === 'delayed').length;
      const atRisk = projects.filter(p => p.risk_score >= 60).length;

      context = `Overall Statistics:\n`;
      context += `- Total Projects: ${total}\n`;
      context += `- Active Projects: ${active}\n`;
      context += `- Delayed Projects: ${delayed}\n`;
      context += `- At-Risk Projects: ${atRisk}\n`;

      const totalBudget = projects.reduce((sum, p) => sum + p.budget_total, 0);
      const utilizedBudget = projects.reduce((sum, p) => sum + p.budget_utilized, 0);
      context += `- Total Budget: $${totalBudget.toLocaleString()}\n`;
      context += `- Utilized Budget: $${utilizedBudget.toLocaleString()}\n`;
    }

    // Try Gemini if configured, otherwise use fallback
    let response;

    if (process.env.GEMINI_API_KEY) {
      response = await askGemini(message, context);
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

// POST /api/ai/report/:projectId
router.post('/report/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { report_type = 'full' } = req.body;

    let project;

    if (isUsingMemoryStore()) {
      project = memoryStore.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' }
        });
      }

      const milestones = memoryStore.getMilestonesByProject(projectId);
      const budgets = memoryStore.getBudgetsByProject(projectId);
      const progressUpdates = memoryStore.getProgressByProject(projectId);
      const department = memoryStore.getDepartmentById(project.department_id);
      const district = memoryStore.getDistrictById(project.district_id);

      project = {
        ...project,
        milestones,
        budgets,
        progressUpdates,
        department,
        district
      };
    } else {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      project = data;
    }

    // Calculate risk
    const riskAnalysis = calculateRiskScore(project);

    // Generate report content
    const report = generateReport(project, riskAnalysis, report_type);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
  }
});

// Fallback response generator
function generateFallbackResponse(message, context) {
  const lowerMessage = message.toLowerCase();

  // Check for specific question patterns
  if (lowerMessage.includes('delayed') || lowerMessage.includes('delay')) {
    const delayed = memoryStore.projects.filter(p => p.status === 'delayed');
    if (delayed.length === 0) {
      return 'There are no delayed projects at the moment. All projects are on schedule!';
    }
    return `There are ${delayed.length} delayed project(s):\n` +
      delayed.map(p => `- ${p.name} (${p.progress_percent}% complete)`).join('\n');
  }

  if (lowerMessage.includes('at risk') || lowerMessage.includes('risk')) {
    const atRisk = memoryStore.projects.filter(p => p.risk_score >= 60);
    if (atRisk.length === 0) {
      return 'No projects are currently at high risk. All projects have acceptable risk levels.';
    }
    return `There are ${atRisk.length} project(s) at risk (score ≥60):\n` +
      atRisk.map(p => `- ${p.name}: Risk Score ${p.risk_score}/100`).join('\n');
  }

  if (lowerMessage.includes('deadline') || lowerMessage.includes('upcoming')) {
    const upcoming = [...memoryStore.projects]
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
    const total = memoryStore.projects.reduce((sum, p) => sum + p.budget_total, 0);
    const utilized = memoryStore.projects.reduce((sum, p) => sum + p.budget_utilized, 0);
    const percent = total > 0 ? Math.round((utilized / total) * 100) : 0;

    return `Budget Overview:\n` +
      `- Total Budget: $${total.toLocaleString()}\n` +
      `- Utilized: $${utilized.toLocaleString()}\n` +
      `- Utilization Rate: ${percent}%\n` +
      `- Remaining: $${(total - utilized).toLocaleString()}`;
  }

  if (lowerMessage.includes('progress') && lowerMessage.includes('department')) {
    const deptStats = memoryStore.departments.map(dept => {
      const deptProjects = memoryStore.projects.filter(p => p.department_id === dept.id);
      const avgProgress = deptProjects.length > 0
        ? Math.round(deptProjects.reduce((s, p) => s + p.progress_percent, 0) / deptProjects.length)
        : 0;
      return { name: dept.name, progress: avgProgress, count: deptProjects.length };
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
  const completedMilestones = (project.milestones || []).filter(m => m.status === 'completed').length;
  const totalMilestones = (project.milestones || []).length;

  const report = {
    id: `report-${Date.now()}`,
    project_id: project.id,
    report_type: reportType,
    generated_at: now.toISOString(),
    content: {
      title: `${project.name} - Project Report`,
      executive_summary: {
        status: project.status,
        overall_progress: `${project.progress_percent}%`,
        budget_status: `${Math.round((project.budget_utilized / project.budget_total) * 100)}% utilized`,
        risk_level: riskAnalysis.riskLevel,
        days_remaining: daysRemaining > 0 ? daysRemaining : 0,
        milestones_completed: `${completedMilestones}/${totalMilestones}`
      },
      sections: [
        {
          heading: 'Project Overview',
          content: `${project.name} is a ${project.priority} priority project under ${project.department?.name || 'the relevant department'}. ` +
            `The project is currently ${project.status} with ${project.progress_percent}% physical progress completed.`
        },
        {
          heading: 'Financial Status',
          content: `Total allocated budget: $${project.budget_total.toLocaleString()}\n` +
            `Amount utilized: $${project.budget_utilized.toLocaleString()}\n` +
            `Remaining budget: $${(project.budget_total - project.budget_utilized).toLocaleString()}\n` +
            `Utilization rate: ${Math.round((project.budget_utilized / project.budget_total) * 100)}%`
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
            ? project.milestones.map(m =>
                `- ${m.title}: ${m.status} ${m.status === 'completed' ? `(${m.completed_at?.split('T')[0] || 'completed'})` : `(due: ${m.due_date})`}`
              ).join('\n')
            : 'No milestones recorded'
        },
        {
          heading: 'Risk Assessment',
          content: `Risk Score: ${riskAnalysis.riskScore}/100 (${riskAnalysis.riskLevel})\n\n` +
            `Key Factors:\n` +
            riskAnalysis.reasons.map(r => `- ${r}`).join('\n') +
            `\n\nRecommendations:\n` +
            riskAnalysis.recommendations.map(r => `- ${r}`).join('\n')
        }
      ],
      summary: `Project "${project.name}" is currently at ${project.progress_percent}% completion with ` +
        `${Math.round((project.budget_utilized / project.budget_total) * 100)}% of the budget utilized. ` +
        `The risk level is assessed as ${riskAnalysis.riskLevel} with ${riskAnalysis.reasons.length} key factors identified.`,
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

module.exports = router;
