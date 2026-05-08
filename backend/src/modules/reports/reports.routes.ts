import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { ReportFormat, Role } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate, requireApprovedDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';
import { config } from '../../config';
import { forbidden, notFound } from '../../lib/http';
import { buildReportData } from './aggregator';
import { buildWeeklyReport } from './correlations';
import { generatePdf } from './pdf';
import { generateExcel } from './excel';

const router = Router();

router.use(authenticate);

const generateSchema = z.object({
  patientDiseaseId: z.string().min(1),
  periodStart: z.string().min(8),
  periodEnd: z.string().min(8),
  format: z.enum(['PDF', 'EXCEL']),
});

router.post(
  '/',
  requireApprovedDoctor,
  asyncHandler(async (req, res) => {
    const data = generateSchema.parse(req.body);

    const pd = await prisma.patientDisease.findUnique({ where: { id: data.patientDiseaseId } });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();
    if (!pd.caregiverId) {
      throw forbidden('Hasta henüz hesabını aktiflestirmedi');
    }

    const start = new Date(data.periodStart);
    const end = new Date(data.periodEnd);
    end.setHours(23, 59, 59, 999);

    const payload = await buildReportData({
      patientDiseaseId: pd.id,
      periodStart: start,
      periodEnd: end,
    });

    fs.mkdirSync(config.reportsDir, { recursive: true });
    const ext = data.format === 'PDF' ? 'pdf' : 'xlsx';
    const filename = `${pd.id}_${Date.now()}.${ext}`;
    const fullPath = path.join(config.reportsDir, filename);

    if (data.format === 'PDF') {
      await generatePdf(payload, fullPath);
    } else {
      await generateExcel(payload, fullPath);
    }

    const created = await prisma.report.create({
      data: {
        doctorId: req.auth!.userId,
        caregiverId: pd.caregiverId,
        patientDiseaseId: pd.id,
        periodStart: start,
        periodEnd: end,
        format: data.format as ReportFormat,
        filePath: filename,
      },
    });

    res.status(201).json(created);
  })
);

const weeklySchema = z.object({
  patientDiseaseId: z.string().min(1),
  weekStart: z.string().min(8).optional(),
});

router.post(
  '/weekly',
  requireApprovedDoctor,
  asyncHandler(async (req, res) => {
    const data = weeklySchema.parse(req.body);
    const pd = await prisma.patientDisease.findUnique({ where: { id: data.patientDiseaseId } });
    if (!pd) throw notFound('Atama bulunamadı');
    if (pd.doctorId !== req.auth!.userId) throw forbidden();
    const weekStart = data.weekStart ? new Date(data.weekStart) : undefined;
    const payload = await buildWeeklyReport(pd.id, weekStart);
    res.json(payload);
  })
);

router.get(
  '/',
  requireApprovedDoctor,
  asyncHandler(async (req, res) => {
    const list = await prisma.report.findMany({
      where: { doctorId: req.auth!.userId },
      orderBy: { generatedAt: 'desc' },
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

router.get(
  '/:id/download',
  asyncHandler(async (req, res) => {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw notFound('Rapor bulunamadı');
    const isOwner = req.auth!.role === Role.OWNER;
    const isReportDoctor = req.auth!.role === Role.DOCTOR && report.doctorId === req.auth!.userId;
    const isReportCaregiver = req.auth!.role === Role.CAREGIVER && report.caregiverId === req.auth!.userId;
    if (!isOwner && !isReportDoctor && !isReportCaregiver) throw forbidden();

    const fullPath = path.join(config.reportsDir, report.filePath);
    if (!fs.existsSync(fullPath)) throw notFound('Dosya bulunamadı');

    const ext = report.format === 'PDF' ? 'pdf' : 'xlsx';
    res.download(fullPath, `report-${report.id}.${ext}`);
  })
);

export default router;
