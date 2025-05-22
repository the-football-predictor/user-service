import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import env from '../../common/config/env';
import { StatusCodes } from 'http-status-codes';

interface JwtPayload {
  userId: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const tokenParts = authHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer' || !tokenParts[1]) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access token is missing or malformed' });
    }
    const token = tokenParts[1];

    jwt.verify(token, env.jwt_secret as string, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token expired' });
        }
        return res.status(StatusCodes.FORBIDDEN).json({ message: 'Invalid token' });
      }

      const payload = decoded as JwtPayload;
      req.user = payload;
      next();
    });
  } else {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authorization header missing' });
  }
};
