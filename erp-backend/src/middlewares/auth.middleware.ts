import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    businessId: string;
    role: string;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
};

import Business from '../models/Business.model';

export const checkLockedFY = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Allow GET requests as they only read data
  if (req.method === 'GET') {
    return next();
  }
  
  if (!req.user || !req.user.businessId) {
    return next();
  }

  try {
    const business = await Business.findById(req.user.businessId);
    if (business && business.isLocked) {
      res.status(403).json({ message: 'This Financial Year is locked. Edits are not allowed. Please contact an administrator to unlock it if needed.' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking financial year status' });
  }
};

