import { Router } from 'express';
import { DiseaseCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error';

const router = Router();

router.use(authenticate);

router.get(
  '/diseases',
  asyncHandler(async (req, res) => {
    const category = req.query.category as DiseaseCategory | undefined;
    const onlySystem = req.query.system === 'true';
    const diseases = await prisma.disease.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(onlySystem ? { isSystem: true } : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { symptoms: true } } },
    });
    res.json(diseases);
  })
);

router.get(
  '/diseases/:id/symptoms',
  asyncHandler(async (req, res) => {
    const symptoms = await prisma.symptom.findMany({
      where: { diseaseId: req.params.id },
      orderBy: { name: 'asc' },
    });
    res.json(symptoms);
  })
);

router.get(
  '/medications',
  asyncHandler(async (_req, res) => {
    const meds = await prisma.medication.findMany({ orderBy: { name: 'asc' } });
    res.json(meds);
  })
);

export default router;
