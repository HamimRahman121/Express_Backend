declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'admin' | 'user'; jti: string; exp: number };
    }
  }
}
export {};