import { Router } from 'express';
import { z } from 'zod';
import { BodyPosition, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';

const router = Router();
router.use(authenticate, requireRole(Role.CAREGIVER));

router.get(
  '/exercise-plans',
  asyncHandler(async (req, res) => {
    const list = await prisma.exercisePlan.findMany({
      where: { caregiverId: req.auth!.userId, active: true },
      include: {
        exercise: true,
        completions: {
          where: { completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { completedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(list);
  })
);

router.post(
  '/exercise-plans/:id/complete',
  asyncHandler(async (req, res) => {
    const plan = await prisma.exercisePlan.findUnique({ where: { id: req.params.id } });
    if (!plan) throw notFound('Egzersiz planı bulunamadı');
    if (plan.caregiverId !== req.auth!.userId) throw forbidden();
    const created = await prisma.exerciseCompletion.create({
      data: { planId: plan.id, note: req.body?.note },
    });
    res.status(201).json(created);
  })
);

const pressureSchema = z.object({
  position: z.enum(['LEFT_SIDE', 'RIGHT_SIDE', 'SUPINE', 'PRONE', 'SITTING']),
  note: z.string().max(500).optional(),
  checkedAt: z.string().datetime().optional(),
});

router.get(
  '/pressure-checks',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await prisma.pressureSoreCheck.findMany({
      where: { caregiverId: req.auth!.userId, checkedAt: { gte: since } },
      orderBy: { checkedAt: 'desc' },
    });
    res.json(list);
  })
);

router.post(
  '/pressure-checks',
  asyncHandler(async (req, res) => {
    const data = pressureSchema.parse(req.body);
    const created = await prisma.pressureSoreCheck.create({
      data: {
        caregiverId: req.auth!.userId,
        position: data.position as BodyPosition,
        note: data.note,
        checkedAt: data.checkedAt ? new Date(data.checkedAt) : new Date(),
      },
    });
    res.status(201).json(created);
  })
);

export default router;
