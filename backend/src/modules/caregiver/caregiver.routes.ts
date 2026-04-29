import { Router } from 'express';
import { z } from 'zod';
import { Role, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';
import { checkDose, getToday, syncDoses } from './today.service';

const router = Router();

router.use(authenticate, requireRole(Role.CAREGIVER));

router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await prisma.caregiverProfile.findUnique({
      where: { userId: req.auth!.userId },
      include: {
        user: { select: { email: true } },
        metrics: { orderBy: { recordedAt: 'desc' } },
        diseases: {
          where: { status: 'ACTIVE' },
          include: {
            disease: { select: { id: true, name: true, category: true } },
            doctor: { include: { doctor: { select: { fullName: true, specialty: true, title: true } } } },
          },
          orderBy: { activatedAt: 'desc' },
        },
      },
    });
    if (!profile) throw notFound('Profil bulunamadı');
    res.json(profile);
  })
);

const metricsSchema = z.object({
  heightCm: z.number().positive().max(260),
  weightKg: z.number().positive().max(400),
});

router.patch(
  '/metrics',
  asyncHandler(async (req, res) => {
    const data = metricsSchema.parse(req.body);
    const created = await prisma.patientMetric.create({
      data: { caregiverId: req.auth!.userId, ...data },
    });
    res.status(201).json(created);
  })
);

router.get(
  '/diseases',
  asyncHandler(async (req, res) => {
    const list = await prisma.patientDisease.findMany({
      where: { caregiverId: req.auth!.userId, status: 'ACTIVE' },
      include: {
        disease: true,
        doctor: { include: { doctor: { select: { fullName: true, specialty: true } } } },
        _count: { select: { prescriptions: true, symptomLogs: true } },
      },
      orderBy: { activatedAt: 'desc' },
    });
    res.json(list);
  })
);

router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const data = await getToday(req.auth!.userId);
    res.json(data);
  })
);

const symptomLogSchema = z.object({
  patientDiseaseId: z.string().min(1),
  symptomId: z.string().min(1),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  note: z.string().optional(),
});

router.post(
  '/symptom-logs',
  asyncHandler(async (req, res) => {
    const data = symptomLogSchema.parse(req.body);
    const pd = await prisma.patientDisease.findUnique({ where: { id: data.patientDiseaseId } });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.caregiverId !== req.auth!.userId) throw forbidden();
    const symptom = await prisma.symptom.findUnique({ where: { id: data.symptomId } });
    if (!symptom || symptom.diseaseId !== pd.diseaseId) throw notFound('Semptom bu hastalıkla eşleşmiyor');
    const created = await prisma.symptomLog.create({
      data: {
        patientDiseaseId: data.patientDiseaseId,
        symptomId: data.symptomId,
        severity: data.severity as Severity,
        note: data.note,
      },
    });
    res.status(201).json(created);
  })
);

const checkSchema = z.object({
  takenAt: z.string().datetime().optional(),
  note: z.string().optional(),
});

router.post(
  '/dose-events/:id/check',
  asyncHandler(async (req, res) => {
    const { takenAt, note } = checkSchema.parse(req.body);
    const result = await checkDose({
      caregiverId: req.auth!.userId,
      doseEventId: req.params.id,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
      note,
    });
    if (!result) throw notFound('Doz olayı bulunamadı');
    res.json(result);
  })
);

router.get(
  '/diseases/:patientDiseaseId/history',
  asyncHandler(async (req, res) => {
    const id = req.params.patientDiseaseId;
    const pd = await prisma.patientDisease.findUnique({
      where: { id },
      include: { disease: { include: { symptoms: true } } },
    });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.caregiverId !== req.auth!.userId) throw forbidden();

    await syncDoses(req.auth!.userId);

    const symptomLogs = await prisma.symptomLog.findMany({
      where: { patientDiseaseId: id },
      include: { symptom: { select: { id: true, name: true } } },
      orderBy: { loggedAt: 'desc' },
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientDiseaseId: id },
      include: { medication: true, doses: { orderBy: { scheduledAt: 'desc' } } },
    });

    res.json({
      assignment: {
        id: pd.id,
        disease: { id: pd.disease.id, name: pd.disease.name, category: pd.disease.category },
        symptomCatalog: pd.disease.symptoms,
      },
      symptomLogs,
      prescriptions,
    });
  })
);

export default router;
