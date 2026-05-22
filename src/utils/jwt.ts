import jwt, { type JwtPayload } from 'jsonwebtoken'

import { config } from '../config'

type TokenPayload = {
  id: number
  name: string
  role: 'contributor' | 'maintainer'
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, config.secret) as JwtPayload & TokenPayload
}

export const signToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.secret, {
    expiresIn: '7d',
  })
}
