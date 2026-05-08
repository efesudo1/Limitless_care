import { DoseStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { prisma } from '../../lib/prisma';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('tr');

const TZ = 'Europe/Istanbul';
const ON_TIME_GRACE_MIN = 30; // 30dk içinde alındıysa zamanında
const MISSED_GRACE_MIN = 60; // planlananın 60dk sonrası geçtiyse atlanmış say

export function startOfDayTz(d: Date | string = new Date()): Date {
  return dayjs(d).tz(TZ).startOf('day').toDate();
}

export function endOfDayTz(d: Date | string = new Date()): Date {
  return dayjs(d).tz(TZ).endOf('day').toDate();
}

function combineDateTimeTz(day: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  return dayjs(day).tz(TZ).hour(h).minute(m).second(0).millisecond(0).toDate();
}

/**
 * Caregiver'ın aktif reçeteleri için, verilen aralıkta DoseEvent'leri materialize eder.
 * - Eksik (prescriptionId, scheduledAt) eşleşmesini PENDING olarak yaratır.
 * - Süresi geçmiş PENDING'leri MISSED olarak günceller.
 */
export async function syncDoses(caregiverId: string, opts?: { from?: Date; to?: Date }) {
  const now = new Date();
  const lookbackDefault = dayjs().tz(TZ).subtract(30, 'day').startOf('day').toDate();
  const from = opts?.from ?? lookbackDefault;
  const to = opts?.to ?? endOfDayTz(now);

  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientDisease: { caregiverId },
      startsOn: { lte: to },
      OR: [{ endsOn: null }, { endsOn: { gte: from } }],
    },
  });

  for (const p of prescriptions) {
    const start = p.startsOn > from ? p.startsOn : from;
    const end = p.endsOn && p.endsOn < to ? p.endsOn : to;
    let cursor = dayjs(start).tz(TZ).startOf('day');
    const last = dayjs(end).tz(TZ).endOf('day');

    while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
      for (const time of p.scheduleTimes) {
        const scheduledAt = combineDateTimeTz(cursor.toDate(), time);
        if (scheduledAt < p.startsOn) continue;
        if (p.endsOn && scheduledAt > p.endsOn) continue;

        await prisma.doseEvent.upsert({
          where: {
            prescriptionId_scheduledAt: { prescriptionId: p.id, scheduledAt },
          },
          create: { prescriptionId: p.id, scheduledAt, status: DoseStatus.PENDING },
          update: {},
        });
      }
      cursor = cursor.add(1, 'day');
    }
  }

  // Süresi geçmiş PENDING'leri MISSED'e çevir
  const missedThreshold = dayjs(now).subtract(MISSED_GRACE_MIN, 'minute').toDate();
  await prisma.doseEvent.updateMany({
    where: {
      status: DoseStatus.PENDING,
      scheduledAt: { lt: missedThreshold },
      prescription: { patientDisease: { caregiverId } },
    },
    data: { status: DoseStatus.MISSED },
  });
}

export async function checkDose(params: {
  caregiverId: string;
  doseEventId: string;
  takenAt: Date;
  note?: string;
}) {
  const event = await prisma.doseEvent.findUnique({
    where: { id: params.doseEventId },
    include: { prescription: { include: { patientDisease: true } } },
  });
  if (!event) return null;
  if (event.prescription.patientDisease.caregiverId !== params.caregiverId) return null;

  const delayMs = params.takenAt.getTime() - event.scheduledAt.getTime();
  const delayMin = Math.max(0, Math.round(delayMs / 60000));
  const status =
    delayMin <= ON_TIME_GRACE_MIN ? DoseStatus.TAKEN_ON_TIME : DoseStatus.TAKEN_LATE;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.doseEvent.update({
      where: { id: event.id },
      data: { status, takenAt: params.takenAt, delayMinutes: delayMin, note: params.note },
    });
    let lowStockWarning: { prescriptionId: string; remaining: number; daysRemaining: number | null } | null = null;
    if (event.prescription.stockCount != null && event.prescription.stockCount > 0) {
      const next = Math.max(0, event.prescription.stockCount - 1);
      await tx.prescription.update({
        where: { id: event.prescription.id },
        data: { stockCount: next, lastStockUpdate: new Date() },
      });
      const threshold = event.prescription.stockAlertThreshold ?? 5;
      if (next <= threshold) {
        const dailyDoses = Math.max(1, event.prescription.scheduleTimes.length);
        lowStockWarning = {
          prescriptionId: event.prescription.id,
          remaining: next,
          daysRemaining: dailyDoses > 0 ? Math.floor(next / dailyDoses) : null,
        };
      }
    }
    return { updated, lowStockWarning };
  });

  return { ...result.updated, lowStockWarning: result.lowStockWarning };
}

export async function refillStock(params: {
  caregiverId: string;
  prescriptionId: string;
  addedCount: number;
}) {
  const prescription = await prisma.prescription.findUnique({
    where: { id: params.prescriptionId },
    include: { patientDisease: true },
  });
  if (!prescription) return null;
  if (prescription.patientDisease.caregiverId !== params.caregiverId) return null;
  const current = prescription.stockCount ?? 0;
  return prisma.prescription.update({
    where: { id: prescription.id },
    data: {
      stockCount: current + params.addedCount,
      lastStockUpdate: new Date(),
    },
    select: { id: true, stockCount: true, stockAlertThreshold: true, lastStockUpdate: true },
  });
}

export async function getToday(caregiverId: string) {
  await syncDoses(caregiverId);

  const dayStart = startOfDayTz();
  const dayEnd = endOfDayTz();

  const diseases = await prisma.patientDisease.findMany({
    where: { caregiverId, status: 'ACTIVE' },
    include: {
      disease: { include: { symptoms: true } },
      prescriptions: {
        where: {
          startsOn: { lte: dayEnd },
          OR: [{ endsOn: null }, { endsOn: { gte: dayStart } }],
        },
        include: {
          medication: true,
          doses: {
            where: { scheduledAt: { gte: dayStart, lte: dayEnd } },
            orderBy: { scheduledAt: 'asc' },
          },
        },
      },
      symptomLogs: {
        where: { loggedAt: { gte: dayStart, lte: dayEnd } },
        select: { symptomId: true, severity: true, loggedAt: true },
      },
    },
  });

  return diseases.map((d) => ({
    patientDiseaseId: d.id,
    disease: { id: d.disease.id, name: d.disease.name, category: d.disease.category, iconKey: d.disease.iconKey },
    symptoms: d.disease.symptoms,
    todaysSymptomLogs: d.symptomLogs,
    prescriptions: d.prescriptions.map((p) => ({
      id: p.id,
      medication: p.medication,
      doseAmount: p.doseAmount,
      doseUnit: p.doseUnit,
      instructions: p.instructions,
      foodRequirement: p.foodRequirement,
      stockCount: p.stockCount,
      stockAlertThreshold: p.stockAlertThreshold,
      lowStock:
        p.stockCount != null && p.stockCount <= (p.stockAlertThreshold ?? 5),
      scheduleTimes: p.scheduleTimes,
      doses: p.doses,
    })),
  }));
}

export const TIMEZONE = TZ;
