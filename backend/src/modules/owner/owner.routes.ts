import { Router } from 'express';
import { z } from 'zod';
import { DoctorStatus, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { notFound } from '../../lib/http';

const router = Router();

router.use(authenticate, requireRole(Role.OWNER));

// ---------- Doctors ----------

router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const status = req.query.status as DoctorStatus | undefined;
    const doctors = await prisma.doctorProfile.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, createdAt: true } } },
    });
    res.json(doctors);
  })
);

router.post(
  '/doctors/:id/approve',
  asyncHandler(async (req, res) => {
    const updated = await prisma.doctorProfile.update({
      where: { userId: req.params.id },
      data: {
        status: DoctorStatus.APPROVED,
        reviewedById: req.auth!.userId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });
    res.json(updated);
  })
);

const rejectSchema = z.object({ reason: z.string().min(3) });

router.post(
  '/doctors/:id/reject',
  asyncHandler(async (req, res) => {
    const { reason } = rejectSchema.parse(req.body);
    const updated = await prisma.doctorProfile.update({
      where: { userId: req.params.id },
      data: {
        status: DoctorStatus.REJECTED,
        reviewedById: req.auth!.userId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });
    res.json(updated);
  })
);

// ---------- Diseases ----------

const diseaseSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['MENTAL_DEVELOPMENTAL', 'MENTAL_HEALTH', 'NEURO_PHYSICAL', 'SENSORY', 'CHRONIC']),
  description: z.string().min(3),
  iconKey: z.string().optional(),
});

router.post(
  '/diseases',
  asyncHandler(async (req, res) => {
    const data = diseaseSchema.parse(req.body);
    const created = await prisma.disease.create({ data: { ...data, isSystem: true } });
    res.status(201).json(created);
  })
);

router.patch(
  '/diseases/:id',
  asyncHandler(async (req, res) => {
    const data = diseaseSchema.partial().parse(req.body);
    const updated = await prisma.disease.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/diseases/:id',
  asyncHandler(async (req, res) => {
    await prisma.disease.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// ---------- Symptoms ----------

const symptomSchema = z.object({
  diseaseId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().min(3),
  iconKey: z.string().optional(),
});

router.post(
  '/symptoms',
  asyncHandler(async (req, res) => {
    const data = symptomSchema.parse(req.body);
    const disease = await prisma.disease.findUnique({ where: { id: data.diseaseId } });
    if (!disease) throw notFound('Hastalık bulunamadı');
    const created = await prisma.symptom.create({ data: { ...data, isSystem: true } });
    res.status(201).json(created);
  })
);

router.patch(
  '/symptoms/:id',
  asyncHandler(async (req, res) => {
    const data = symptomSchema.omit({ diseaseId: true }).partial().parse(req.body);
    const updated = await prisma.symptom.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/symptoms/:id',
  asyncHandler(async (req, res) => {
    await prisma.symptom.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

// ---------- Medications ----------

const medicationSchema = z.object({
  name: z.string().min(2),
  defaultUnit: z.string().min(1),
  description: z.string().optional(),
});

router.post(
  '/medications',
  asyncHandler(async (req, res) => {
    const data = medicationSchema.parse(req.body);
    const created = await prisma.medication.create({ data: { ...data, isSystem: true } });
    res.status(201).json(created);
  })
);

router.patch(
  '/medications/:id',
  asyncHandler(async (req, res) => {
    const data = medicationSchema.partial().parse(req.body);
    const updated = await prisma.medication.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

router.delete(
  '/medications/:id',
  asyncHandler(async (req, res) => {
    await prisma.medication.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
