import { NextFunction, Request, Response } from 'express';
import { Role, DoctorStatus } from '@prisma/client';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { forbidden, unauthorized } from '../lib/http';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: Role;
      };
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  // Tarayıcıdan dosya indirme gibi durumlar için query fallback
  const t = req.query?.t;
  if (typeof t === 'string' && t.length > 10) return t;
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Token gerekli'));
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized('Geçersiz token'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(unauthorized());
    if (!roles.includes(req.auth.role)) return next(forbidden('Yetkiniz yok'));
    next();
  };
}

export async function requireApprovedDoctor(req: Request, _res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== Role.DOCTOR) return next(forbidden('Doktor yetkisi gerekli'));
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.auth.userId } });
  if (!profile) return next(forbidden('Doktor profili bulunamadı'));
  if (profile.status !== DoctorStatus.APPROVED) {
    return next(forbidden('Hesabınız henüz onaylanmadı'));
  }
  next();
}
