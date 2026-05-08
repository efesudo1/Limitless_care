import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate, requireApprovedDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';

const router = Router();
router.use(authenticate, requireApprovedDoctor);

// ---------- Exercise catalog ----------

router.get(
  '/exercises',
  asyncHandler(async (req, res) => {
    const list = await prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { createdById: req.auth!.userId }],
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    res.json(list);
  })
);

const exerciseSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(3).max(2000),
  videoUrl: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  durationMin: z.number().int().positive().max(240),
});

router.post(
  '/exercises',
  asyncHandler(async (req, res) => {
    const data = exerciseSchema.parse(req.body);
    const created = await prisma.exercise.create({
      data: {
        name: data.name,
        description: data.description,
        videoUrl: data.videoUrl,
        durationMin: data.durationMin,
        isSystem: false,
        createdById: req.auth!.userId,
      },
    });
    res.status(201).json(created);
  })
);

// ---------- Exercise plans (doctor → patient) ----------

const planSchema = z.object({
  patientDiseaseId: z.string().min(1),
  exerciseId: z.string().min(1),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1),
});

router.post(
  '/exercise-plans',
  asyncHandler(async (req, res) => {
    const data = planSchema.parse(req.body);
    const pd = await prisma.patientDisease.findUnique({
      where: { id: data.patientDiseaseId },
      include: { caregiver: { select: { userId: true } } },
    });
    if (!pd) throw notFound('Hasta-hastalık ataması bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();
    if (!pd.caregiver) throw notFound('Hasta henüz hesabını aktifleştirmedi');

    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise) throw notFound('Egzersiz bulunamadı');

    const created = await prisma.exercisePlan.create({
      data: {
        caregiverId: pd.caregiver.userId,
        exerciseId: data.exerciseId,
        scheduleTimes: data.scheduleTimes,
        assignedByDoctorId: req.auth!.userId,
        active: true,
      },
      include: { exercise: true },
    });
    res.status(201).json(created);
  })
);

router.get(
  '/patients/:patientDiseaseId/exercise-plans',
  asyncHandler(async (req, res) => {
    const pd = await prisma.patientDisease.findUnique({
      where: { id: req.params.patientDiseaseId },
      include: { caregiver: { select: { userId: true } } },
    });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();
    if (!pd.caregiver) {
      res.json([]);
      return;
    }
    const plans = await prisma.exercisePlan.findMany({
      where: { caregiverId: pd.caregiver.userId },
      include: {
        exercise: true,
        completions: { orderBy: { completedAt: 'desc' }, take: 10 },
      },
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(plans);
  })
);

router.patch(
  '/exercise-plans/:id',
  asyncHandler(async (req, res) => {
    const schema = z.object({ active: z.boolean() });
    const { active } = schema.parse(req.body);
    const plan = await prisma.exercisePlan.findUnique({ where: { id: req.params.id } });
    if (!plan) throw notFound('Plan bulunamadı');
    if (plan.assignedByDoctorId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.exercisePlan.update({
      where: { id: plan.id },
      data: { active },
    });
    res.json(updated);
  })
);

export default router;
