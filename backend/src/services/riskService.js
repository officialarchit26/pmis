// Risk Analysis Service
// Grounded in actual project data from the database

function calculateRiskScore(project) {
  const isCompleted = project.status === 'completed' || Number(project.progress_percent) >= 100;
  const factors = [];
  const recommendations = [];
  let computedScore = 0;

  if (isCompleted) {
    factors.push('Project successfully completed (100% physical progress)');
    factors.push(`Final budget utilization: $${Number(project.budget_utilized || 0).toLocaleString()} of $${Number(project.budget_total || 0).toLocaleString()}`);
    recommendations.push('Conduct final post-completion asset handover audit');
    recommendations.push('Archive closeout documentation in PMIS records');
    computedScore = 15;
  } else {
    // 1. Schedule Risk
    const scheduleRisk = calculateScheduleRisk(project);
    computedScore += scheduleRisk.score;
    factors.push(...scheduleRisk.factors);
    recommendations.push(...scheduleRisk.recommendations);

    // 2. Budget Risk
    const budgetRisk = calculateBudgetRisk(project);
    computedScore += budgetRisk.score;
    factors.push(...budgetRisk.factors);
    recommendations.push(...budgetRisk.recommendations);

    // 3. Milestone Risk
    const milestoneRisk = calculateMilestoneRisk(project);
    computedScore += milestoneRisk.score;
    factors.push(...milestoneRisk.factors);
    recommendations.push(...milestoneRisk.recommendations);

    // 4. Status Risk
    const statusRisk = calculateStatusRisk(project);
    computedScore += statusRisk.score;
    factors.push(...statusRisk.factors);
    recommendations.push(...statusRisk.recommendations);

    computedScore = Math.min(100, Math.max(0, computedScore));
  }

  // Consistent with database risk_score if present, or computed score if absent
  const riskScore =
    project.risk_score !== undefined && project.risk_score !== null
      ? Number(project.risk_score)
      : computedScore;

  // Determine risk level based on standardized thresholds
  let riskLevel;
  if (riskScore <= 25) riskLevel = 'LOW';
  else if (riskScore <= 50) riskLevel = 'MEDIUM';
  else if (riskScore <= 75) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  // Limit recommendations and factors to top 5 unique entries
  const topFactors = [...new Set(factors)].slice(0, 5);
  const topRecommendations = [...new Set(recommendations)].slice(0, 5);

  return {
    riskScore,
    riskLevel,
    factors: topFactors,
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

  if (elapsed <= 0) {
    return { score: 0, factors: ['Project scheduled to commence in future'], recommendations: ['Finalize pre-construction mobilization'] };
  }

  const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const actualProgress = Number(project.progress_percent || 0);
  const progressGap = expectedProgress - actualProgress;

  if (now > end) {
    score += 15;
    factors.push(`Past scheduled completion deadline (${project.end_date})`);
    recommendations.push('Establish expedited recovery schedule and management escalation');
  } else {
    const daysRemaining = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 30) {
      score += 5;
      factors.push(`Approaching target deadline (${daysRemaining} days remaining)`);
      recommendations.push('Prioritize critical-path milestone deliverables');
    }
  }

  if (progressGap > 20) {
    score += 15;
    factors.push(`Physical progress (${actualProgress}%) is ${Math.round(progressGap)}% behind expected timeline`);
    recommendations.push('Accelerate contractor deployment to close schedule variance');
  } else if (progressGap > 10) {
    score += 10;
    factors.push(`Physical progress (${actualProgress}%) is slightly behind expected timeline (${Math.round(progressGap)}% gap)`);
    recommendations.push('Monitor milestone velocity closely');
  }

  return { score, factors, recommendations };
}

function calculateBudgetRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  const total = Number(project.budget_total || 0);
  const utilized = Number(project.budget_utilized || 0);

  if (total === 0) {
    return { score: 5, factors: ['No budget allocated'], recommendations: ['Define project budget'] };
  }

  const utilizationRate = utilized / total;
  const progressRate = Number(project.progress_percent || 0) / 100;

  if (utilizationRate > 0.9) {
    score += 15;
    factors.push(`Budget utilization high (${Math.round(utilizationRate * 100)}% utilized)`);
    recommendations.push('Review cost projections and financial reserves');
  } else if (utilizationRate > 0.75) {
    score += 10;
    factors.push(`Moderate-to-high budget drawdown (${Math.round(utilizationRate * 100)}% utilized)`);
  }

  if (utilizationRate > progressRate + 0.2) {
    score += 10;
    factors.push(`Budget burn rate (${Math.round(utilizationRate * 100)}%) outpaces physical progress (${Math.round(progressRate * 100)}%)`);
    recommendations.push('Audit contractor invoicing against verified site deliverables');
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

  if (overdueMilestones.length > 0) {
    score += 15;
    const names = overdueMilestones.map(m => m.title).slice(0, 2).join(', ');
    factors.push(`${overdueMilestones.length} milestone(s) overdue: ${names}`);
    recommendations.push('Address overdue milestone deliverables immediately');
  }

  if (blockedMilestones.length > 0) {
    score += 15;
    const names = blockedMilestones.map(m => m.title).slice(0, 2).join(', ');
    factors.push(`${blockedMilestones.length} milestone(s) blocked: ${names}`);
    recommendations.push('Resolve site interdependencies and clear milestone blockers');
  }

  return { score, factors, recommendations };
}

function calculateStatusRisk(project) {
  const factors = [];
  const recommendations = [];
  let score = 0;

  switch (project.status) {
    case 'delayed':
      score += 25;
      factors.push('Project status is marked as DELAYED');
      recommendations.push('Initiate formal schedule recovery plan with executive oversight');
      break;
    case 'on_hold':
      score += 20;
      factors.push('Project status is currently ON HOLD');
      recommendations.push('Convene stakeholder review to evaluate resumption conditions');
      break;
    case 'cancelled':
      score += 20;
      factors.push('Project has been CANCELLED');
      recommendations.push('Complete project post-mortem and audit unspent allocations');
      break;
    case 'planning':
      score += 5;
      factors.push('Project in initial planning and design phase');
      break;
    case 'active':
    default:
      factors.push('Project actively progressing');
      break;
  }

  if (project.priority === 'critical') {
    score = Math.min(100, score * 1.2);
  }

  return { score, factors, recommendations };
}

module.exports = {
  calculateRiskScore
};
