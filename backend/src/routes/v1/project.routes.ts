import { Router, Request, Response } from 'express'
import { AppError } from '../../middleware/errorHandler'

const router = Router()

// Mock projects data for development
const mockProjects = [
  {
    id: '1',
    name: 'Highway Expansion Phase 1',
    description: 'Expand highway 101 by 50 miles',
    department_id: '1',
    district_id: '1',
    status: 'active',
    progress_percent: 65,
    start_date: '2025-01-15',
    end_date: '2026-06-30',
    budget_total: 5000000,
    budget_utilized: 3250000,
    risk_score: 45,
    created_at: '2025-01-01',
    updated_at: '2025-09-01'
  },
  {
    id: '2',
    name: 'School Modernization Program',
    description: 'Upgrade 20 schools with new technology',
    department_id: '2',
    district_id: '2',
    status: 'active',
    progress_percent: 85,
    start_date: '2024-06-01',
    end_date: '2025-12-31',
    budget_total: 2500000,
    budget_utilized: 2125000,
    risk_score: 25,
    created_at: '2024-06-01',
    updated_at: '2025-09-01'
  },
  {
    id: '3',
    name: 'Water Treatment Plant',
    description: 'Build new water treatment facility',
    department_id: '3',
    district_id: '3',
    status: 'planning',
    progress_percent: 15,
    start_date: '2026-01-01',
    end_date: '2027-06-30',
    budget_total: 8000000,
    budget_utilized: 400000,
    risk_score: 30,
    created_at: '2025-09-01',
    updated_at: '2025-09-01'
  }
]

/**
 * GET /api/v1/projects
 * List all projects with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
  const { status, department_id, search } = req.query

  let projects = [...mockProjects]

  if (status && typeof status === 'string') {
    projects = projects.filter(p => p.status === status)
  }

  if (department_id && typeof department_id === 'string') {
    projects = projects.filter(p => p.department_id === department_id)
  }

  if (search && typeof search === 'string') {
    const searchLower = search.toLowerCase()
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower)
    )
  }

  res.json({
    success: true,
    data: projects,
    meta: {
      total: projects.length,
      page: 1,
      limit: 20
    }
  })
})

/**
 * GET /api/v1/projects/:id
 * Get single project with milestones and budget
 */
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const project = mockProjects.find(p => p.id === id)

  if (!project) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  // Mock milestones
  const milestones = [
    { id: '1', project_id: id, title: 'Planning Phase', status: 'completed', due_date: '2025-03-01' },
    { id: '2', project_id: id, title: 'Design Approval', status: 'completed', due_date: '2025-06-01' },
    { id: '3', project_id: id, title: 'Construction', status: 'in_progress', due_date: '2025-12-01' },
    { id: '4', project_id: id, title: 'Final Inspection', status: 'pending', due_date: '2026-03-01' }
  ]

  // Mock budget by category
  const budget = [
    { id: '1', project_id: id, category: 'Materials', allocated: 2000000, utilized: 1300000, fiscal_year: 2025 },
    { id: '2', project_id: id, category: 'Labor', allocated: 2000000, utilized: 1400000, fiscal_year: 2025 },
    { id: '3', project_id: id, category: 'Equipment', allocated: 1000000, utilized: 550000, fiscal_year: 2025 }
  ]

  res.json({
    success: true,
    data: {
      ...project,
      milestones,
      budget
    }
  })
})

/**
 * POST /api/v1/projects
 * Create new project
 */
router.post('/', async (req: Request, res: Response) => {
  const { name, description, department_id, district_id, start_date, end_date } = req.body

  if (!name) {
    throw new AppError('Project name is required', 400, 'VALIDATION_ERROR')
  }

  const newProject = {
    id: String(mockProjects.length + 1),
    name,
    description,
    department_id,
    district_id,
    status: 'planning',
    progress_percent: 0,
    start_date,
    end_date,
    budget_total: 0,
    budget_utilized: 0,
    risk_score: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  mockProjects.push(newProject)

  res.status(201).json({
    success: true,
    data: newProject
  })
})

/**
 * PUT /api/v1/projects/:id
 * Update project
 */
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const projectIndex = mockProjects.findIndex(p => p.id === id)

  if (projectIndex === -1) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  mockProjects[projectIndex] = {
    ...mockProjects[projectIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  }

  res.json({
    success: true,
    data: mockProjects[projectIndex]
  })
})

/**
 * DELETE /api/v1/projects/:id
 * Delete project
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const projectIndex = mockProjects.findIndex(p => p.id === id)

  if (projectIndex === -1) {
    throw new AppError('Project not found', 404, 'NOT_FOUND')
  }

  mockProjects.splice(projectIndex, 1)

  res.json({
    success: true,
    message: 'Project deleted successfully'
  })
})

export { router as projectRoutes }