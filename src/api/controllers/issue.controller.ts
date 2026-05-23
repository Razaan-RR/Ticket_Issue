import type { Request, Response } from 'express'

import { StatusCodes } from 'http-status-codes'

import issueService from '../services/issue.service.js'

import { sendResponse } from '../../utils/sendResponse.js'
import type { IssueStatus, IssueType, UpdateIssue } from '../../types/index.js'

export const createIssue = async (req: Request, res: Response) => {
  const { title, description, type } = req.body

  if (!title || !description || !type) {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Title, description and type are required',
      },
      StatusCodes.BAD_REQUEST,
    )
  }

  const issue = await issueService.createIssue(
    title,
    description,
    type,
    req.user!.id,
  )

  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Failed to create issue',
      },
      StatusCodes.BAD_REQUEST,
    )
  }

  return sendResponse(
    res,
    {
      message: 'Issue created successfully',
      data: issue,
    },
    StatusCodes.CREATED,
  )
}

export const getAllIssues = async (req: Request, res: Response) => {
  const { sort = 'newest', type, status } = req.query

  const issues = await issueService.getAllIssues(
    sort as 'newest' | 'oldest',

    type as IssueType,

    status as IssueStatus,
  )

  return sendResponse(
    res,
    {
      message: 'Issues fetched successfully',

      data: issues,
    },
    StatusCodes.OK,
  )
}

export const getIssue = async (req: Request, res: Response) => {
  const issue = await issueService.getIssueById(Number(req.params.id))

  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,

        message: 'Issue not found',
      },
      StatusCodes.NOT_FOUND,
    )
  }

  return sendResponse(
    res,
    {
      message: 'Issue fetched successfully',

      data: issue,
    },
    StatusCodes.OK,
  )
}

export const updateIssue = async (req: Request, res: Response) => {
  const issueId = Number(req.params.id)

  const issue = await issueService.getIssueRaw(issueId)

  if (!issue) {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Issue not found',
      },
      StatusCodes.NOT_FOUND,
    )
  }

  const user = req.user!

  const isMaintainer = user.role === 'maintainer'

  const isOwner = issue.reporter_id === user.id

  if (!isMaintainer) {
    if (!isOwner) {
      return sendResponse(
        res,
        {
          error: true,
          message: 'Forbidden',
        },
        StatusCodes.FORBIDDEN,
      )
    }

    if (issue.status !== 'open') {
      return sendResponse(
        res,
        {
          error: true,
          message: 'Cannot update non-open issue',
        },
        StatusCodes.CONFLICT,
      )
    }
  }

  const payload: UpdateIssue = {
    title: req.body.title,
    description: req.body.description,
    type: req.body.type,
    status: req.body.status,
  }

  const updated = await issueService.updateIssue(issueId, payload)

  if (!updated) {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Failed to update issue',
      },
      StatusCodes.BAD_REQUEST,
    )
  }

  return sendResponse(
    res,
    {
      message: 'Issue updated successfully',

      data: updated,
    },
    StatusCodes.OK,
  )
}

export const deleteIssue = async (req: Request, res: Response) => {
  const issueId = Number(req.params.id)

  const deleted = await issueService.deleteIssue(issueId)

  if (!deleted) {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Issue not found',
      },
      StatusCodes.NOT_FOUND,
    )
  }

  return sendResponse(
    res,
    {
      message: 'Issue deleted successfully',
    },
    StatusCodes.OK,
  )
}
