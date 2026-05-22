import { Router } from 'express'

import { auth, authorizeRoles } from '../../middleware/auth.js'

import {
  createIssue,
  deleteIssue,
  getAllIssues,
  getIssue,
  updateIssue,
} from '../controllers/issue.controller.js'

const router = Router()

router.post('/', auth, createIssue)

router.get('/', getAllIssues)

router.get('/:id', getIssue)

router.patch('/:id', auth, updateIssue)

router.delete(
  '/:id',

  auth,

  authorizeRoles('maintainer'),

  deleteIssue,
)

export default router
