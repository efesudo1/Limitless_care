import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

import { MENTAL_DEVELOPMENTAL_DISEASES } from './data/diseases-mental-developmental';
import { MENTAL_HEALTH_DISEASES } from './data/diseases-mental-health';
import { NEURO_PHYSICAL_DISEASES } from './data/diseases-neuro-physical';
import { SENSORY_DISEASES } from './data/diseases-sensory';
import { CHRONIC_DISEASES } from './data/diseases-chronic';
import { MEDICATIONS } from './data/medications';
import { EXERCISES } from './data/exercises';
import { SeedDisease } from './data/types';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const prisma = new PrismaClient();

const ALL_DISEASES: SeedDisease[] = [
  ...MENTAL_DEVELOPMENTAL_DISEASES,
  ...MENTAL_HEALTH_DISEASES,
  ...NEURO_PHYSICAL_DISEASES,
  ...SENSORY_DISEASES,
  ...CHRONIC_DISEASES,
];

async function seedOwner() {
  const email = (process.env.OWNER_EMAIL ?? 'owner@limitlesscare.local').toLowerCase();
  const password = process.env.OWNER_PASSWORD ?? 'Owner!2024Dev';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] owner ${email} zaten var, atlandı`);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, passwordHash, role: Role.OWNER },
  });
  console.log(`[seed] owner ${email} oluşturuldu`);
}

async function seedMedications() {
  let added = 0;
  for (const m of MEDICATIONS) {
    const existing = await prisma.medication.findUnique({ where: { name: m.name } });
    if (!existing) {
      await prisma.medication.create({ data: { ...m, isSystem: true } });
      added++;
    }
  }
  console.log(`[seed] medications: +${added} (toplam ${MEDICATIONS.length})`);
}

async function seedDiseases() {
  let createdDiseases = 0;
  let createdSymptoms = 0;
  for (const d of ALL_DISEASES) {
    const existing = await prisma.disease.findFirst({
      where: { name: d.name, isSystem: true },
      include: { symptoms: { select: { name: true } } },
    });

    let diseaseId: string;
    if (!existing) {
      const created = await prisma.disease.create({
        data: {
          name: d.name,
          category: d.category,
          description: d.description,
          iconKey: d.iconKey,
          isSystem: true,
        },
      });
      diseaseId = created.id;
      createdDiseases++;
    } else {
      diseaseId = existing.id;
    }

    const existingNames = new Set(existing?.symptoms.map((s) => s.name) ?? []);
    for (const s of d.symptoms) {
      if (existingNames.has(s.name)) continue;
      await prisma.symptom.create({
        data: {
          diseaseId,
          name: s.name,
          description: s.description,
          iconKey: s.iconKey,
          isSystem: true,
        },
      });
      createdSymptoms++;
    }
  }
  console.log(
    `[seed] diseases: +${createdDiseases} hastalık, +${createdSymptoms} semptom (toplam ${ALL_DISEASES.length} hastalık)`
  );
}

async function seedExercises() {
  let added = 0;
  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isSystem: true },
    });
    if (!existing) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          description: ex.description,
          videoUrl: ex.videoUrl,
          durationMin: ex.durationMin,
          isSystem: true,
        },
      });
      added++;
    }
  }
  console.log(`[seed] exercises: +${added} (toplam ${EXERCISES.length})`);
}

async function main() {
  console.log('[seed] başlıyor...');
  await seedOwner();
  await seedMedications();
  await seedDiseases();
  await seedExercises();
  console.log('[seed] tamamlandı');
}

main()
  .catch((err) => {
    console.error('[seed] hata:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
