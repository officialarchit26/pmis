import { Router, Request, Response } from 'express'

const router = Router()

/**
 * GET /api/v1/dashboard/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      total_projects: 150,
      active_projects: 85,
      completed_projects: 25,
      at_risk_projects: 18,
      delayed_projects: 12,
      budget_total: 50000000,
      budget_utilized: 23500000,
      budget_utilization_percent: 47,
      average_progress: 52.3
    }
  })
})

/**
 * GET /api/v1/dashboard/departments
 * Get department-wise statistics
 */
router.get('/departments', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Transportation', code: 'DOT', project_count: 35, total_budget: 15000000, utilized: 7500000 },
      { id: '2', name: 'Education', code: 'EDU', project_count: 28, total_budget: 12000000, utilized: 6000000 },
      { id: '3', name: 'Health', code: 'HLT', project_count: 22, total_budget: 10000000, utilized: 4000000 },
      { id: '4', name: 'Public Works', code: 'PWK', project_count: 25, total_budget: 8000000, utilized: 3200000 },
      { id: '5', name: 'Finance', code: 'FIN', project_count: 15, total_budget: 5000000, utilized: 2800000 }
    ]
  })
})

/**
 * GET /api/v1/dashboard/risky
 * Get at-risk projects
 */
router.get('/risky', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: '1', name: 'Bridge Construction Project', risk_score: 85, risk_level: 'critical', status: 'delayed' },
      { id: '2', name: 'Metro Line Extension', risk_score: 78, risk_level: 'high', status: 'on_hold' },
      { id: '3', name: 'Airport Renovation', risk_score: 72, risk_level: 'high', status: 'active' },
      { id: '4', name: 'Solar Farm Initiative', risk_score: 68, risk_level: 'high', status: 'active' },
      { id: '5', name: 'Waste Management System', risk_score: 65, risk_level: 'medium', status: 'active' }
    ]
  })
})

/**
 * GET /api/v1/dashboard/budget-summary
 * Get budget summary
 */
router.get('/budget-summary', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      total_allocated: 50000000,
      total_utilized: 23500000,
      remaining: 26500000,
      utilization_percent: 47,
      by_department: [
        { name: 'Transportation', allocated: 15000000, utilized: 7500000 },
        { name: 'Education', allocated: 12000000, utilized: 6000000 },
        { name: 'Health', allocated: 10000000, utilized: 4000000 },
        { name: 'Public Works', allocated: 8000000, utilized: 3200000 },
        { name: 'Finance', allocated: 5000000, utilized: 2800000 }
      ]
    }
  })
})

export { router as dashboardRoutes }