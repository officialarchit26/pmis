// In-memory data store for development without Supabase
// This is SYNTHETIC DEMO DATA for the MVP

// Load data from seed files
const departments = require('../../../data/seed/departments.json');
const districts = require('../../../data/seed/districts.json');
const projects = require('../../../data/seed/projects.json');
const milestones = require('../../../data/seed/milestones.json');
const budgets = require('../../../data/seed/budgets.json');

// Generate progress updates for projects
const progressUpdates = projects.map((project, index) => {
  const numUpdates = Math.floor(Math.random() * 4) + 2;
  const updates = [];
  for (let i = 0; i < numUpdates; i++) {
    const daysAgo = (numUpdates - i) * 30;
    const updateDate = new Date();
    updateDate.setDate(updateDate.getDate() - daysAgo);
    const progressAtUpdate = Math.min(
      100,
      Math.max(0, (project.progress_percent / numUpdates) * (i + 1))
    );
    updates.push({
      id: `prog-${project.id}-${i + 1}`,
      project_id: project.id,
      progress_percent: Math.round(progressAtUpdate * 100) / 100,
      notes: getRandomNote(i, numUpdates, project),
      created_at: updateDate.toISOString()
    });
  }
  return updates;
}).flat();

function getRandomNote(current, total, project) {
  const notes = [
    'Initial baseline established',
    'Site preparation completed',
    'Materials delivered and inspected',
    'Construction work began on schedule',
    'Major phase milestone achieved',
    'Quality inspection passed',
    'Stakeholder review completed',
    'Progress on track with timeline',
    'Resource allocation updated',
    'Weather-related work adjustment',
    'Additional funding approved',
    'Phase transition completed'
  ];
  return notes[current % notes.length] + ` for ${project.name}`;
}

// Generate alerts for delayed and at-risk projects
const alerts = projects
  .filter(p => p.status === 'delayed' || p.status === 'on_hold' || p.risk_score > 60)
  .map((project, index) => {
    const alertTypes = [];
    if (project.status === 'delayed') alertTypes.push('delay');
    if (project.risk_score > 60) alertTypes.push('risk');
    if (project.budget_utilized / project.budget_total > 0.7) alertTypes.push('budget_overrun');

    return alertTypes.map((type, typeIndex) => ({
      id: `alert-${project.id}-${typeIndex}`,
      project_id: project.id,
      type: type,
      severity: project.risk_score > 75 ? 'critical' : project.risk_score > 50 ? 'high' : 'medium',
      title: getAlertTitle(type, project),
      message: getAlertMessage(type, project),
      is_resolved: false,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
  })
  .flat();

function getAlertTitle(type, project) {
  const titles = {
    delay: `Project "${project.name}" is delayed`,
    risk: `High risk detected for "${project.name}"`,
    budget_overrun: `Budget alert for "${project.name}"`,
    deadline: `Approaching deadline for "${project.name}"`,
    milestone_overdue: `Overdue milestone in "${project.name}"`
  };
  return titles[type] || `Alert for ${project.name}`;
}

function getAlertMessage(type, project) {
  const messages = {
    delay: `This project is currently marked as delayed. Progress is at ${project.progress_percent}%.`,
    risk: `Risk score is ${project.risk_score}/100. Immediate attention recommended.`,
    budget_overrun: `Budget utilization is at ${Math.round((project.budget_utilized / project.budget_total) * 100)}%.`,
    deadline: `Project deadline is approaching. Current progress: ${project.progress_percent}%.`,
    milestone_overdue: `One or more milestones are overdue for this project.`
  };
  return messages[type] || '';
}

module.exports = {
  departments,
  districts,
  projects,
  milestones,
  progressUpdates,
  budgets,
  alerts,

  // Helper functions
  getProjectById: (id) => projects.find(p => p.id === id),
  getDepartmentById: (id) => departments.find(d => d.id === id),
  getDistrictById: (id) => districts.find(d => d.id === id),
  getMilestonesByProject: (projectId) =>
    milestones.filter(m => m.project_id === projectId).sort((a, b) => a.order_num - b.order_num),
  getBudgetsByProject: (projectId) => budgets.filter(b => b.project_id === projectId),
  getProgressByProject: (projectId) =>
    progressUpdates.filter(p => p.project_id === projectId).sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    ),
  getAlertsByProject: (projectId) => alerts.filter(a => a.project_id === projectId),

  // Mutation
  addProject: (project) => {
    const newProject = {
      id: `proj-new-${Date.now()}`,
      ...project,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.push(newProject);
    return newProject;
  },
  updateProject: (id, updates) => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return null;
    projects[index] = {
      ...projects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    return projects[index];
  },
  addProgressUpdate: (projectId, update) => {
    const newUpdate = {
      id: `prog-new-${Date.now()}`,
      project_id: projectId,
      ...update,
      created_at: new Date().toISOString()
    };
    progressUpdates.push(newUpdate);
    return newUpdate;
  }
};
