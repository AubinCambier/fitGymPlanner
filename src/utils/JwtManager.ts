import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  role: string;
  email: string;
  fp: string;
}

const secret = () => process.env.JWT_SECRET as string;

export const JwtManager = {
  createJWT(id: number, role: string, email: string, passwordHash: string): string {
    const fp = passwordHash.slice(-8);
    return jwt.sign({ id, role, email, fp }, secret(), { expiresIn: '7d' });
  },

  decodeJWT(token: string): JwtPayload {
    return jwt.verify(token, secret()) as JwtPayload;
  },
};
