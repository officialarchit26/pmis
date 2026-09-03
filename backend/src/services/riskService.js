// Risk Analysis Service
// Calculates risk scores based on project data

function calculateRiskScore(project) {
  const factors = [];
  const recommendations = [];
  let riskScore = 0;

  // 1. Schedule Risk (30 points max)
  const scheduleRisk = calculateScheduleRisk(project);
  riskScore += scheduleRisk.score;
  factors.push(...scheduleRisk.factors);
  recommendations.push(...scheduleRisk.recommendations);

  // 2. Budget Risk (25 points max)
  const budgetRisk = calculateBudgetRisk(project);
  riskScore += budgetRisk.score;
  factors.push(...budgetRisk.factors);
  recommendations.push(...budgetRisk.recommendations);

  // 3. Milestone Risk (25 points max)
  const milestoneRisk = calculateMilestoneRisk(project);
  riskScore += milestoneRisk.score;
  factors.push(...milestoneRisk.factors);
  recommendations.push(...milestoneRisk.recommendations);

  // 4. Status Risk (20 points max)
  const statusRisk = calculateStatusRisk(project);
  riskScore += statusRisk.score;
  factors.push(...statusRisk.factors);
  recommendations.push(...statusRisk.recommendations);

  // Cap at 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine risk level
  let riskLevel;
  if (riskScore <= 25) riskLevel = 'LOW';
  else if (riskScore <= 50) riskLevel = 'MEDIUM';
  else if (riskScore <= 75) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  // Limit recommendations to top 5
  const topRecommendations = [...new Set(recommendations)].slice(0, 5);

  return {
    riskScore,
    riskLevel,
    factors: [...new Set(factors)].slice(0, 5),
    recommendations: topRecommendations,
    analyzedAt: new Date().toISOString()
  };
}

function calculateScheduleRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  if (!project.start_date || !project.end_date) {
    return { score: 5, factors: ['Timeline not defined'], recommendations: ['Set project start and end dates'] };
  }

  const start = new Date(project.start_date);
  const end = new Date(project.end_date);
  const now = new Date();

  const totalDuration = end - start;
  const elapsed = now - start;

  if (elapsed <= 0) return { score: 0, factors: [], recommendations: [] };

  const expectedProgress = (elapsed / totalDuration) * 100;
  const actualProgress = project.progress_percent || 0;
  const progressGap = expectedProgress - actualProgress;

  // Behind schedule
  if (progressGap > 20) {
    score += 15;
    factors.push(`Significantly behind schedule (${Math.round(progressGap)}% behind expected)`);
    recommendations.push('Accelerate work to catch up with timeline');
    recommendations.push('Review resource allocation');
  } else if (progressGap > 10) {
    score += 10;
    factors.push(`Behind schedule (${Math.round(progressGap)}% behind expected)`);
    recommendations.push('Monitor progress closely');
  } else if (progressGap > 5) {
    score += 5;
    factors.push(`Slightly behind schedule (${Math.round(progressGap)}% behind)`);
  }

  // Days remaining
  const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) {
    score += 10;
    factors.push('Project is overdue');
    recommendations.push('Escalate to management');
  } else if (daysRemaining < 30) {
    score += 5;
    factors.push('Approaching deadline (less than 30 days remaining)');
    recommendations.push('Prioritize critical tasks');
  }

  return { score, factors, recommendations };
}

function calculateBudgetRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  if (!project.budget_total || project.budget_total === 0) {
    return { score: 5, factors: ['No budget allocated'], recommendations: ['Define project budget'] };
  }

  const utilizationRate = (project.budget_utilized || 0) / project.budget_total;
  const progressRate = (project.progress_percent || 0) / 100;

  // Budget consumed vs progress made
  if (utilizationRate > 0.9) {
    score += 15;
    factors.push('Budget nearly exhausted (>90% used)');
    recommendations.push('Review spending immediately');
    recommendations.push('Request additional funding if needed');
  } else if (utilizationRate > 0.75) {
    score += 10;
    factors.push('High budget utilization (>75% used)');
    recommendations.push('Monitor spending closely');
  } else if (utilizationRate > 0.5) {
    score += 5;
    factors.push('Moderate budget utilization');
  }

  // Budget vs Progress comparison
  if (utilizationRate > progressRate + 0.2) {
    score += 10;
    factors.push('Budget consumed faster than progress made');
    recommendations.push('Investigate cost overruns');
  }

  return { score, factors, recommendations };
}

function calculateMilestoneRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  const milestones = project.milestones || [];
  if (milestones.length === 0) {
    return { score: 0, factors: [], recommendations: [] };
  }

  const overdueMilestones = milestones.filter(m =>
    m.status === 'overdue' ||
    (m.status !== 'completed' && new Date(m.due_date) < new Date())
  );

  const blockedMilestones = milestones.filter(m => m.status === 'blocked');
  const pendingMilestones = milestones.filter(m => m.status === 'pending');
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress');

  // Overdue milestones
  if (overdueMilestones.length > 0) {
    score += 15;
    factors.push(`${overdueMilestones.length} milestone(s) overdue`);
    recommendations.push('Address overdue milestones immediately');
  }

  // Blocked milestones
  if (blockedMilestones.length > 0) {
    score += 10;
    factors.push(`${blockedMilestones.length} milestone(s) blocked`);
    recommendations.push('Resolve blockers to unblock progress');
  }

  // Many pending milestones close to deadline
  const urgentPending = pendingMilestones.filter(m => {
    const daysUntilDue = Math.ceil((new Date(m.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDue < 30;
  });

  if (urgentPending.length > 0) {
    score += 5;
    factors.push(`${urgentPending.length} milestone(s) due within 30 days`);
  }

  return { score, factors, recommendations };
}

function calculateStatusRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  switch (project.status) {
    case 'delayed':
      score += 20;
      factors.push('Project status is DELAYED');
      recommendations.push('Develop recovery plan');
      recommendations.push('Escalate to stakeholders');
      break;
    case 'on_hold':
      score += 15;
      factors.push('Project is ON HOLD');
      recommendations.push('Review hold reasons and plan restart');
      break;
    case 'cancelled':
      score += 20;
      factors.push('Project is CANCELLED');
      recommendations.push('Document lessons learned');
      break;
    case 'completed':
      score = Math.min(score, 5);
      factors.push('Project completed');
      break;
    case 'planning':
      score += 5;
      factors.push('Project in planning phase');
      break;
    case 'active':
    default:
      // Active is normal, no additional score
      break;
  }

  // Priority adjustment
  if (project.priority === 'critical') {
    score = Math.min(100, score * 1.2);
  }

  return { score, factors, recommendations };
}

module.exports = {
  calculateRiskScore
};
