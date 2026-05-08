import { Router } from 'express';
import { z } from 'zod';
import { DisabilityCategory, Role, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';
import { checkDose, getToday, refillStock, syncDoses } from './today.service';

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

const profileSchema = z.object({
  disabilityCategory: z.enum(['MENTAL', 'PHYSICAL', 'SENSORY', 'CHRONIC']).optional(),
});

router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const updated = await prisma.caregiverProfile.update({
      where: { userId: req.auth!.userId },
      data: {
        disabilityCategory: data.disabilityCategory as DisabilityCategory | undefined,
      },
    });
    res.json(updated);
  })
);

const medicalCardSchema = z.object({
  bloodType: z.string().max(8).nullable().optional(),
  allergies: z.string().max(2000).nullable().optional(),
  chronicConditions: z.string().max(2000).nullable().optional(),
  medicalNotes: z.string().max(2000).nullable().optional(),
  emergencyMessage: z.string().max(500).nullable().optional(),
});

router.patch(
  '/medical-card',
  asyncHandler(async (req, res) => {
    const data = medicalCardSchema.parse(req.body);
    const updated = await prisma.caregiverProfile.update({
      where: { userId: req.auth!.userId },
      data,
      select: {
        bloodType: true,
        allergies: true,
        chronicConditions: true,
        medicalNotes: true,
        emergencyMessage: true,
      },
    });
    res.json(updated);
  })
);

router.get(
  '/medical-card',
  asyncHandler(async (req, res) => {
    const profile = await prisma.caregiverProfile.findUnique({
      where: { userId: req.auth!.userId },
      select: {
        bloodType: true,
        allergies: true,
        chronicConditions: true,
        medicalNotes: true,
        emergencyMessage: true,
      },
    });
    if (!profile) throw notFound('Profil bulunamadı');
    res.json(profile);
  })
);

const phoneRegex = /^[+]?[0-9\s\-()]{7,20}$/;

const emergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(phoneRegex, 'Geçersiz telefon numarası'),
  relation: z.string().min(1).max(50),
  priority: z.number().int().min(1).max(99).optional(),
});

router.get(
  '/emergency-contacts',
  asyncHandler(async (req, res) => {
    const list = await prisma.emergencyContact.findMany({
      where: { caregiverId: req.auth!.userId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(list);
  })
);

router.post(
  '/emergency-contacts',
  asyncHandler(async (req, res) => {
    const data = emergencyContactSchema.parse(req.body);
    const created = await prisma.emergencyContact.create({
      data: {
        caregiverId: req.auth!.userId,
        name: data.name,
        phone: data.phone,
        relation: data.relation,
        priority: data.priority ?? 1,
      },
    });
    res.status(201).json(created);
  })
);

router.patch(
  '/emergency-contacts/:id',
  asyncHandler(async (req, res) => {
    const data = emergencyContactSchema.partial().parse(req.body);
    const existing = await prisma.emergencyContact.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Kontak bulunamadı');
    if (existing.caregiverId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.emergencyContact.update({
      where: { id: req.params.id },
      data,
    });
    res.json(updated);
  })
);

router.delete(
  '/emergency-contacts/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.emergencyContact.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Kontak bulunamadı');
    if (existing.caregiverId !== req.auth!.userId) throw forbidden();
    await prisma.emergencyContact.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

const emergencyEventSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  sentToContactIds: z.array(z.string()).default([]),
  note: z.string().max(500).optional(),
});

router.post(
  '/emergency-events',
  asyncHandler(async (req, res) => {
    const data = emergencyEventSchema.parse(req.body);
    const created = await prisma.emergencyEvent.create({
      data: {
        caregiverId: req.auth!.userId,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        sentToContactIds: data.sentToContactIds,
        note: data.note,
      },
    });
    res.status(201).json(created);
  })
);

router.get(
  '/emergency-events',
  asyncHandler(async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const list = await prisma.emergencyEvent.findMany({
      where: { caregiverId: req.auth!.userId, triggeredAt: { gte: since } },
      orderBy: { triggeredAt: 'desc' },
    });
    res.json(list);
  })
);

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

const refillSchema = z.object({
  addedCount: z.number().int().positive().max(10000),
});

router.patch(
  '/prescriptions/:id/refill-stock',
  asyncHandler(async (req, res) => {
    const { addedCount } = refillSchema.parse(req.body);
    const result = await refillStock({
      caregiverId: req.auth!.userId,
      prescriptionId: req.params.id,
      addedCount,
    });
    if (!result) throw notFound('Reçete bulunamadı');
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
