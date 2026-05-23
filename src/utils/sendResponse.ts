import type { Response } from 'express'

export function sendResponse<T>(
  res: Response,
  {
    message,
    data,
    errors,
    error,
  }: {
    message: string
    data?: T
    errors?: unknown
    error?: boolean
  },
  status = 200,
) {
  return res.status(status).json({
    success: !error,
    message,
    ...(error ? { errors } : { data }),
  })
}
