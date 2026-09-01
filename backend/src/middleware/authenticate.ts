import { Request, Response, NextFunction } from 'express'
import { UnauthorizedError, ForbiddenError } from './errorHandler'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    department_id?: string
  }
}

/**
 * Middleware to verify JWT token
 * For development, this can be bypassed with NODE_ENV=development
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // In development without auth setup, allow requests through with a mock user
  if (process.env.NODE_ENV === 'development' && !process.env.JWT_SECRET) {
    req.user = {
      id: 'dev-user',
      email: 'dev@projectpulse.gov',
      role: 'admin'
    }
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authorization token required')
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    throw new UnauthorizedError('Invalid token format')
  }

  // TODO: Verify JWT with Supabase or local secret
  // For now, just check token exists
  req.user = {
    id: 'authenticated-user',
    email: 'user@projectpulse.gov',
    role: 'admin'
  }

  next()
}

/**
 * Role-based access control middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError()
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(`Required role: ${allowedRoles.join(' or ')}`)
    }

    next()
  }
}