import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireApprovedDoctor, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';
import { runAllPredictiveJobs } from '../predictive/predictive.service';

const router = Router();
router.use(authenticate);

// Caregiver: kendi alerts'ını listeler
router.get(
  '/me',
  requireRole(Role.CAREGIVER),
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unreadOnly === 'true';
    const list = await prisma.predictiveAlert.findMany({
      where: {
        patientDisease: { caregiverId: req.auth!.userId },
        ...(unreadOnly ? { readByCaregiver: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { patientDisease: { include: { disease: { select: { name: true } } } } },
    });
    res.json(list);
  })
);

router.post(
  '/me/:id/read',
  requireRole(Role.CAREGIVER),
  asyncHandler(async (req, res) => {
    const alert = await prisma.predictiveAlert.findUnique({
      where: { id: req.params.id },
      include: { patientDisease: true },
    });
    if (!alert) throw notFound('Uyarı bulunamadı');
    if (alert.patientDisease.caregiverId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.predictiveAlert.update({
      where: { id: req.params.id },
      data: { readByCaregiver: true },
    });
    res.json(updated);
  })
);

// Doctor: kendi hastalarının alerts'ı
router.get(
  '/doctor',
  requireApprovedDoctor,
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unreadOnly === 'true';
    const list = await prisma.predictiveAlert.findMany({
      where: {
        patientDisease: { doctorId: req.auth!.userId },
        ...(unreadOnly ? { readByDoctor: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        patientDisease: {
          include: {
            disease: { select: { name: true } },
            caregiver: { select: { fullName: true } },
          },
        },
      },
    });
    res.json(list);
  })
);

router.post(
  '/doctor/:id/read',
  requireApprovedDoctor,
  asyncHandler(async (req, res) => {
    const alert = await prisma.predictiveAlert.findUnique({
      where: { id: req.params.id },
      include: { patientDisease: true },
    });
    if (!alert) throw notFound('Uyarı bulunamadı');
    if (alert.patientDisease.doctorId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.predictiveAlert.update({
      where: { id: req.params.id },
      data: { readByDoctor: true },
    });
    res.json(updated);
  })
);

// Manuel cron tetikleme — geliştirme/test amacıyla owner+doktor erişebilir
router.post(
  '/run',
  requireApprovedDoctor,
  asyncHandler(async (_req, res) => {
    await runAllPredictiveJobs();
    res.json({ ok: true });
  })
);

export default router;
