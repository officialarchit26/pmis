import { Router, Request, Response } from 'express'
import { AppError, UnauthorizedError } from '../../middleware/errorHandler'

const router = Router()

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR')
  }

  // TODO: Implement actual authentication with Supabase
  // For now, return mock response for development
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user-id',
        email: email,
        full_name: 'Demo User',
        role: 'admin',
        department_id: null
      },
      token: 'demo-jwt-token-' + Date.now()
    }
  })
})

/**
 * POST /api/v1/auth/logout
 * Logout and invalidate token
 */
router.post('/logout', async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

/**
 * GET /api/v1/auth/me
 * Get current authenticated user
 */
router.get('/me', async (req: Request, res: Response) => {
  // TODO: Verify JWT and return actual user
  res.json({
    success: true,
    data: {
      user: {
        id: 'demo-user-id',
        email: 'admin@projectpulse.gov',
        full_name: 'Demo Admin',
        role: 'admin'
      }
    }
  })
})

export { router as authRoutes }