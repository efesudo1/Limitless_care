import { Router } from 'express';
import { z } from 'zod';
import { BehaviorEventType, MoodKind, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';

const router = Router();
router.use(authenticate, requireRole(Role.CAREGIVER));

// ---- Mood logs ----

const moodSchema = z.object({
  mood: z.enum(['HAPPY', 'CALM', 'ANXIOUS', 'SAD', 'ANGRY']),
  intensity: z.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
  loggedAt: z.string().datetime().optional(),
});

router.get(
  '/mood-logs',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await prisma.moodLog.findMany({
      where: { caregiverId: req.auth!.userId, loggedAt: { gte: since } },
      orderBy: { loggedAt: 'desc' },
    });
    res.json(list);
  })
);

router.post(
  '/mood-logs',
  asyncHandler(async (req, res) => {
    const data = moodSchema.parse(req.body);
    const created = await prisma.moodLog.create({
      data: {
        caregiverId: req.auth!.userId,
        mood: data.mood as MoodKind,
        intensity: data.intensity,
        note: data.note,
        loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
      },
    });
    res.status(201).json(created);
  })
);

// ---- Routine items ----

const routineSchema = z.object({
  label: z.string().min(1).max(100),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).default([]),
  active: z.boolean().optional(),
});

router.get(
  '/routines',
  asyncHandler(async (req, res) => {
    const list = await prisma.routineItem.findMany({
      where: { caregiverId: req.auth!.userId },
      include: {
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
  '/routines',
  asyncHandler(async (req, res) => {
    const data = routineSchema.parse(req.body);
    const created = await prisma.routineItem.create({
      data: {
        caregiverId: req.auth!.userId,
        label: data.label,
        scheduleTimes: data.scheduleTimes,
        active: data.active ?? true,
      },
    });
    res.status(201).json(created);
  })
);

router.patch(
  '/routines/:id',
  asyncHandler(async (req, res) => {
    const data = routineSchema.partial().parse(req.body);
    const existing = await prisma.routineItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Rutin bulunamadı');
    if (existing.caregiverId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.routineItem.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  })
);

router.delete(
  '/routines/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.routineItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Rutin bulunamadı');
    if (existing.caregiverId !== req.auth!.userId) throw forbidden();
    await prisma.routineItem.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

router.post(
  '/routines/:id/complete',
  asyncHandler(async (req, res) => {
    const existing = await prisma.routineItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Rutin bulunamadı');
    if (existing.caregiverId !== req.auth!.userId) throw forbidden();
    const created = await prisma.routineCompletion.create({
      data: { routineItemId: req.params.id, note: req.body?.note },
    });
    res.status(201).json(created);
  })
);

// ---- Behavior events ----

const behaviorSchema = z.object({
  type: z.enum(['TANTRUM', 'REPETITIVE', 'AGGRESSION', 'WITHDRAWAL', 'OTHER']),
  durationMin: z.number().int().min(0).max(1440).optional(),
  trigger: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
});

router.get(
  '/behavior-events',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await prisma.behaviorEvent.findMany({
      where: { caregiverId: req.auth!.userId, occurredAt: { gte: since } },
      orderBy: { occurredAt: 'desc' },
    });
    res.json(list);
  })
);

router.post(
  '/behavior-events',
  asyncHandler(async (req, res) => {
    const data = behaviorSchema.parse(req.body);
    const created = await prisma.behaviorEvent.create({
      data: {
        caregiverId: req.auth!.userId,
        type: data.type as BehaviorEventType,
        durationMin: data.durationMin,
        trigger: data.trigger,
        note: data.note,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      },
    });
    res.status(201).json(created);
  })
);

export default router;
