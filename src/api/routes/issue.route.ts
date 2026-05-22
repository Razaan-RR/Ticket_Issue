import { Router } from 'express'

import { auth } from '../../middleware/auth.js'

import {
  createIssue,
  getAllIssues,
  getIssue,
} from '../controllers/issue.controller.js'

const router = Router()

router.post('/', auth, createIssue)

router.get('/', getAllIssues)

router.get('/:id', getIssue)

export default router
