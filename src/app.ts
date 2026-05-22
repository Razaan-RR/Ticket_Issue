import express, { type Application, type Request, type Response } from 'express'

import logger from './middleware/logger.js'
import globalErrorHandler from './middleware/globalErrorHandler.js'

import authRoutes from './api/routes/auth.route.js'
import issueRoutes from './api/routes/issue.route.js'

const app: Application = express()

app.use(express.json())

app.use(logger)

app.use('/api/auth', authRoutes)

app.use('/api/issues', issueRoutes)

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world')
})

app.use(globalErrorHandler)

export default app
