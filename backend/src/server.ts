import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './config/database'
import { authRoutes } from './routes/v1/auth.routes'
import { projectRoutes } from './routes/v1/project.routes'
import { dashboardRoutes } from './routes/v1/dashboard.routes'
import { aiRoutes } from './routes/v1/ai.routes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: { code: 'RATE_LIMIT', message: 'Too many requests from this IP, please try again later.' } }
})
app.use('/api/', limiter)

// API routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/projects', projectRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)
app.use('/api/v1/ai', aiRoutes)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler (must be last middleware)
app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, async () => {
  console.log(`🚀 Project Pulse Backend running on port ${PORT}`)
  await connectDatabase()
  console.log('✅ Database connected')
})