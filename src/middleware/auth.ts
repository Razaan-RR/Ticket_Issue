import type { NextFunction, Request, Response } from 'express'

import { StatusCodes } from 'http-status-codes'

import authService from '../api/services/auth.service.js'

import type { Role } from '../types'

import { verifyToken } from '../utils/jwt.js'

import { sendResponse } from '../utils/sendResponse.js'

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization

    if (!token) {
      return sendResponse(
        res,
        {
          error: true,
          message: 'Authentication required',
        },
        StatusCodes.UNAUTHORIZED,
      )
    }

    const payload = verifyToken(token)

    const user = await authService.getUserById(payload.id)

    if (!user) {
      return sendResponse(
        res,
        {
          error: true,
          message: 'User not found',
        },
        StatusCodes.NOT_FOUND,
      )
    }

    req.user = {
      id: user.id,
      name: user.name,
      role: user.role,
    }

    next()
  } catch {
    return sendResponse(
      res,
      {
        error: true,
        message: 'Invalid or expired token',
      },
      StatusCodes.UNAUTHORIZED,
    )
  }
}

export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendResponse(
        res,
        {
          error: true,
          message: 'Unauthorized',
        },
        StatusCodes.UNAUTHORIZED,
      )
    }

    if (!roles.includes(req.user.role)) {
      return sendResponse(
        res,
        {
          error: true,
          message: 'Forbidden',
        },
        StatusCodes.FORBIDDEN,
      )
    }

    next()
  }
}
