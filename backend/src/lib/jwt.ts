import jwt, { SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';

export type AccessTokenPayload = {
  sub: string;
  role: Role;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTtl,
  } as SignOptions);
}

export function signRefreshToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshTtl,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as AccessTokenPayload;
}
