import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (userId: string, businessId: string, role: string): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'];
  return jwt.sign({ userId, businessId, role }, secret, { expiresIn });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
