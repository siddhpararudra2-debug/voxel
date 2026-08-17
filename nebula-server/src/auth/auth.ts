import type { NextFunction, Request, Response } from 'express';
import type { Socket } from 'socket.io';
import { supabaseAuth } from '../config/supabase.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accessToken?: string;
}

function bearerToken(value?: string): string | undefined {
  if (!value?.startsWith('Bearer ')) return undefined;
  return value.slice('Bearer '.length).trim();
}

export async function verifyToken(token: string): Promise<{ userId: string; email?: string }> {
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid authentication token');
  return { userId: data.user.id, email: data.user.email };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }
    const user = await verifyToken(token);
    req.userId = user.userId;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
}

export async function authenticateSocket(socket: Socket, next: (error?: Error) => void): Promise<void> {
  try {
    const token = typeof socket.handshake.auth?.token === 'string'
      ? socket.handshake.auth.token
      : bearerToken(socket.handshake.headers.authorization);
    if (!token) return next(new Error('Authentication required'));
    const user = await verifyToken(token);
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
}
