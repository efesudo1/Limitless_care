import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error';
import * as service from './auth.service';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { prisma } from '../../lib/prisma';
import { unauthorized } from '../../lib/http';

const router = Router();

const doctorSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  diplomaNumber: z.string().min(3),
  title: z.string().min(2),
  specialty: z.string().min(2),
});

const caregiverSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().min(8),
  heightCm: z.number().positive().max(260),
  weightKg: z.number().positive().max(400),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/register/doctor',
  asyncHandler(async (req, res) => {
    const data = doctorSchema.parse(req.body);
    const { user } = await service.registerDoctor(data);
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      doctor: { status: user.doctor!.status, fullName: user.doctor!.fullName },
      message: 'Kayıt alındı, owner onayı bekleniyor.',
    });
  })
);

router.post(
  '/register/caregiver',
  asyncHandler(async (req, res) => {
    const data = caregiverSchema.parse(req.body);
    const { user } = await service.registerCaregiver(data);
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await service.login(email, password);
    res.json(result);
  })
);

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Geçersiz refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw unauthorized('Kullanıcı bulunamadı');
    res.json({
      accessToken: signAccessToken({ sub: user.id, role: user.role }),
      refreshToken: signRefreshToken({ sub: user.id, role: user.role }),
    });
  })
);

export default router;
