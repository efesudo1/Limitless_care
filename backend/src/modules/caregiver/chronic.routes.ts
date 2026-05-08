import { Router } from 'express';
import { z } from 'zod';
import { Role, SeizureType, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';

const router = Router();
router.use(authenticate, requireRole(Role.CAREGIVER));

const seizureSchema = z.object({
  occurredAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().min(1).max(86400),
  type: z.enum(['TONIC_CLONIC', 'ABSENCE', 'MYOCLONIC', 'FOCAL', 'OTHER']),
  trigger: z.string().max(200).optional(),
  postIctalNotes: z.string().max(500).optional(),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
});

router.get(
  '/seizures',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await prisma.seizureEvent.findMany({
      where: { caregiverId: req.auth!.userId, occurredAt: { gte: since } },
      orderBy: { occurredAt: 'desc' },
    });
    res.json(list);
  })
);

router.post(
  '/seizures',
  asyncHandler(async (req, res) => {
    const data = seizureSchema.parse(req.body);
    const created = await prisma.seizureEvent.create({
      data: {
        caregiverId: req.auth!.userId,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        durationSeconds: data.durationSeconds,
        type: data.type as SeizureType,
        trigger: data.trigger,
        postIctalNotes: data.postIctalNotes,
        severity: (data.severity as Severity | undefined) ?? null,
      },
    });
    res.status(201).json(created);
  })
);

router.get(
  '/seizures/stats',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await prisma.seizureEvent.findMany({
      where: { caregiverId: req.auth!.userId, occurredAt: { gte: since } },
    });
    const dayLabels = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const byDayOfWeek: Record<string, number> = {};
    dayLabels.forEach((l) => (byDayOfWeek[l] = 0));
    const byHour: Record<string, number> = {};
    for (let h = 0; h < 24; h++) byHour[String(h).padStart(2, '0')] = 0;

    for (const e of events) {
      const d = new Date(e.occurredAt);
      byDayOfWeek[dayLabels[d.getDay()]] += 1;
      byHour[String(d.getHours()).padStart(2, '0')] += 1;
    }
    res.json({
      total: events.length,
      windowDays: days,
      byDayOfWeek,
      byHour,
    });
  })
);

export default router;
