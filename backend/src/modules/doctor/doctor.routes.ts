import { Router } from 'express';
import { z } from 'zod';
import { AssignmentStatus, DiseaseCategory, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireApprovedDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { forbidden, notFound } from '../../lib/http';
import { assignDiseaseToEmail } from './assignment.service';

const router = Router();

router.use(authenticate);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.auth!.userId },
      include: { user: { select: { email: true } } },
    });
    if (!profile) throw notFound('Doktor profili bulunamadı');
    res.json(profile);
  })
);

router.use(requireApprovedDoctor);

// ---------- Patients ----------

router.get(
  '/patients',
  asyncHandler(async (req, res) => {
    const assignments = await prisma.patientDisease.findMany({
      where: {
        doctorId: req.auth!.userId,
        status: { in: [AssignmentStatus.ACTIVE, AssignmentStatus.PENDING_USER] },
      },
      include: {
        disease: { select: { id: true, name: true, category: true } },
        caregiver: {
          include: {
            user: { select: { email: true } },
            metrics: { orderBy: { recordedAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const grouped = new Map<
      string,
      {
        caregiverEmail: string;
        caregiverId: string | null;
        fullName: string | null;
        latestMetric: { heightCm: number; weightKg: number; recordedAt: Date } | null;
        diseases: Array<{ id: string; name: string; status: AssignmentStatus; assignedAt: Date }>;
      }
    >();

    for (const a of assignments) {
      const key = a.caregiverId ?? a.caregiverEmail;
      const existing = grouped.get(key);
      const latest = a.caregiver?.metrics[0] ?? null;
      const entry =
        existing ??
        {
          caregiverEmail: a.caregiverEmail,
          caregiverId: a.caregiverId,
          fullName: a.caregiver?.fullName ?? null,
          latestMetric: latest,
          diseases: [] as Array<{ id: string; name: string; status: AssignmentStatus; assignedAt: Date }>,
        };
      entry.diseases.push({
        id: a.id,
        name: a.disease.name,
        status: a.status,
        assignedAt: a.assignedAt,
      });
      grouped.set(key, entry);
    }

    res.json(Array.from(grouped.values()));
  })
);

router.get(
  '/patients/:patientDiseaseId/timeline',
  asyncHandler(async (req, res) => {
    const id = req.params.patientDiseaseId;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const pd = await prisma.patientDisease.findUnique({
      where: { id },
      include: {
        disease: { include: { symptoms: true } },
        caregiver: {
          include: { metrics: { orderBy: { recordedAt: 'asc' } }, user: { select: { email: true } } },
        },
      },
    });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();

    const symptomLogs = await prisma.symptomLog.findMany({
      where: {
        patientDiseaseId: id,
        ...(from || to ? { loggedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { symptom: { select: { id: true, name: true } } },
      orderBy: { loggedAt: 'asc' },
    });

    const prescriptions = await prisma.prescription.findMany({
      where: { patientDiseaseId: id },
      include: {
        medication: true,
        doses: {
          where: from || to ? { scheduledAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : undefined,
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    res.json({
      assignment: {
        id: pd.id,
        status: pd.status,
        assignedAt: pd.assignedAt,
        activatedAt: pd.activatedAt,
        disease: { id: pd.disease.id, name: pd.disease.name, category: pd.disease.category },
        symptomCatalog: pd.disease.symptoms,
      },
      caregiver: pd.caregiver && {
        userId: pd.caregiver.userId,
        email: pd.caregiver.user.email,
        fullName: pd.caregiver.fullName,
        gender: pd.caregiver.gender,
        birthDate: pd.caregiver.birthDate,
        metrics: pd.caregiver.metrics,
      },
      symptomLogs,
      prescriptions,
    });
  })
);

// ---------- Assignment ----------

const assignmentSchema = z.object({
  caregiverEmail: z.string().email(),
  diseaseId: z.string().min(1),
});

router.post(
  '/assignments',
  asyncHandler(async (req, res) => {
    const data = assignmentSchema.parse(req.body);
    const result = await assignDiseaseToEmail({
      doctorId: req.auth!.userId,
      caregiverEmail: data.caregiverEmail,
      diseaseId: data.diseaseId,
    });
    res.status(201).json(result);
  })
);

// ---------- Prescriptions ----------

const prescriptionSchema = z.object({
  patientDiseaseId: z.string().min(1),
  medicationId: z.string().min(1),
  doseAmount: z.number().positive(),
  doseUnit: z.string().min(1),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1),
  instructions: z.string().optional(),
  startsOn: z.string().min(8),
  endsOn: z.string().min(8).optional(),
});

router.post(
  '/prescriptions',
  asyncHandler(async (req, res) => {
    const data = prescriptionSchema.parse(req.body);
    const pd = await prisma.patientDisease.findUnique({ where: { id: data.patientDiseaseId } });
    if (!pd) throw notFound('Hasta-hastalık atama bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();

    const created = await prisma.prescription.create({
      data: {
        patientDiseaseId: data.patientDiseaseId,
        medicationId: data.medicationId,
        doseAmount: data.doseAmount,
        doseUnit: data.doseUnit,
        scheduleTimes: data.scheduleTimes,
        instructions: data.instructions,
        startsOn: new Date(data.startsOn),
        endsOn: data.endsOn ? new Date(data.endsOn) : null,
        doctorId: req.auth!.userId,
      },
      include: { medication: true },
    });
    res.status(201).json(created);
  })
);

const prescriptionPatchSchema = z.object({
  doseAmount: z.number().positive().optional(),
  doseUnit: z.string().min(1).optional(),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).optional(),
  instructions: z.string().optional(),
  endsOn: z.string().nullable().optional(),
});

router.patch(
  '/prescriptions/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Reçete bulunamadı');
    if (existing.doctorId !== req.auth!.userId) throw forbidden();

    const data = prescriptionPatchSchema.parse(req.body);
    const updated = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        doseAmount: data.doseAmount ?? undefined,
        doseUnit: data.doseUnit ?? undefined,
        scheduleTimes: data.scheduleTimes ?? undefined,
        instructions: data.instructions ?? undefined,
        endsOn: data.endsOn === undefined ? undefined : data.endsOn ? new Date(data.endsOn) : null,
      },
    });
    res.json(updated);
  })
);

router.post(
  '/prescriptions/:id/end',
  asyncHandler(async (req, res) => {
    const existing = await prisma.prescription.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound('Reçete bulunamadı');
    if (existing.doctorId !== req.auth!.userId) throw forbidden();
    const updated = await prisma.prescription.update({
      where: { id: req.params.id },
      data: { endsOn: new Date() },
    });
    res.json(updated);
  })
);

// ---------- Custom diseases & symptoms (doctor-scoped) ----------

const customDiseaseSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['MENTAL_DEVELOPMENTAL', 'MENTAL_HEALTH', 'NEURO_PHYSICAL', 'SENSORY', 'CHRONIC']),
  description: z.string().min(3),
  iconKey: z.string().optional(),
});

router.post(
  '/diseases',
  asyncHandler(async (req, res) => {
    const data = customDiseaseSchema.parse(req.body);
    const created = await prisma.disease.create({
      data: {
        name: data.name,
        category: data.category as DiseaseCategory,
        description: data.description,
        iconKey: data.iconKey,
        isSystem: false,
        createdById: req.auth!.userId,
      },
    });
    res.status(201).json(created);
  })
);

const customSymptomSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  iconKey: z.string().optional(),
});

router.post(
  '/diseases/:id/symptoms',
  asyncHandler(async (req, res) => {
    const data = customSymptomSchema.parse(req.body);
    const disease = await prisma.disease.findUnique({ where: { id: req.params.id } });
    if (!disease) throw notFound('Hastalık bulunamadı');
    if (!disease.isSystem && disease.createdById !== req.auth!.userId) throw forbidden();
    const created = await prisma.symptom.create({
      data: {
        diseaseId: disease.id,
        name: data.name,
        description: data.description,
        iconKey: data.iconKey,
        isSystem: false,
        createdById: req.auth!.userId,
      },
    });
    res.status(201).json(created);
  })
);

export default router;
// re-export for tests
export { Severity };
