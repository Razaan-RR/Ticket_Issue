import { Router } from 'express'

import { auth } from '../../middleware/auth'

import { createIssue } from '../controllers/issue.controller.js'

const router = Router()

router.post('/', auth, createIssue)

export default router
