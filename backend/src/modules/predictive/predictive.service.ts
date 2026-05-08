import { DoseStatus, PredictiveAlertKind, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

function todayKey(prefix: string) {
  const d = new Date();
  return `${prefix}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function upsertAlert(params: {
  patientDiseaseId: string;
  kind: PredictiveAlertKind;
  payload: any;
  severity: Severity;
  dedupeKey: string;
}) {
  await prisma.predictiveAlert.upsert({
    where: {
      patientDiseaseId_dedupeKey: {
        patientDiseaseId: params.patientDiseaseId,
        dedupeKey: params.dedupeKey,
      },
    },
    create: {
      patientDiseaseId: params.patientDiseaseId,
      kind: params.kind,
      payload: params.payload,
      severity: params.severity,
      dedupeKey: params.dedupeKey,
    },
    update: { payload: params.payload, severity: params.severity },
  });
}

export async function predictStockDepletion() {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      stockCount: { not: null },
      OR: [{ endsOn: null }, { endsOn: { gte: new Date() } }],
    },
    include: { patientDisease: true, medication: true },
  });
  for (const p of prescriptions) {
    const dailyDoses = Math.max(1, p.scheduleTimes.length);
    const remaining = p.stockCount ?? 0;
    const daysRemaining = Math.floor(remaining / dailyDoses);
    const threshold = p.stockAlertThreshold ?? 5;
    if (remaining <= threshold || daysRemaining <= 3) {
      await upsertAlert({
        patientDiseaseId: p.patientDiseaseId,
        kind: PredictiveAlertKind.LOW_STOCK,
        payload: {
          prescriptionId: p.id,
          medicationName: p.medication.name,
          remaining,
          daysRemaining,
        },
        severity: daysRemaining <= 1 ? Severity.SEVERE : Severity.MODERATE,
        dedupeKey: todayKey(`low-stock:${p.id}`),
      });
    }
  }
}

export async function complianceTrend() {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const fourteenDaysAgo = new Date(Date.now() - 14 * DAY_MS);
  const assignments = await prisma.patientDisease.findMany({
    where: { status: 'ACTIVE' },
    include: { prescriptions: { include: { doses: true } } },
  });
  for (const a of assignments) {
    const recent = a.prescriptions.flatMap((p) =>
      p.doses.filter((d) => d.scheduledAt >= sevenDaysAgo)
    );
    const previous = a.prescriptions.flatMap((p) =>
      p.doses.filter((d) => d.scheduledAt >= fourteenDaysAgo && d.scheduledAt < sevenDaysAgo)
    );
    if (recent.length < 5 || previous.length < 5) continue;
    const recentPct =
      recent.filter((d) => d.status === DoseStatus.TAKEN_ON_TIME || d.status === DoseStatus.TAKEN_LATE)
        .length / recent.length;
    const previousPct =
      previous.filter((d) => d.status === DoseStatus.TAKEN_ON_TIME || d.status === DoseStatus.TAKEN_LATE)
        .length / previous.length;
    const drop = previousPct - recentPct;
    if (drop >= 0.2) {
      await upsertAlert({
        patientDiseaseId: a.id,
        kind: PredictiveAlertKind.COMPLIANCE_DROP,
        payload: {
          recentPct: Math.round(recentPct * 100),
          previousPct: Math.round(previousPct * 100),
          dropPct: Math.round(drop * 100),
        },
        severity: drop >= 0.4 ? Severity.SEVERE : Severity.MODERATE,
        dedupeKey: todayKey(`compliance-drop:${a.id}`),
      });
    }
  }
}

export async function symptomSpike() {
  const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS);
  const seventeenDaysAgo = new Date(Date.now() - 17 * DAY_MS);
  const assignments = await prisma.patientDisease.findMany({
    where: { status: 'ACTIVE' },
  });
  const sevScore = (s: Severity) => (s === 'MILD' ? 1 : s === 'MODERATE' ? 2 : 3);
  for (const a of assignments) {
    const recent = await prisma.symptomLog.findMany({
      where: { patientDiseaseId: a.id, loggedAt: { gte: threeDaysAgo } },
    });
    const baseline = await prisma.symptomLog.findMany({
      where: {
        patientDiseaseId: a.id,
        loggedAt: { gte: seventeenDaysAgo, lt: threeDaysAgo },
      },
    });
    if (recent.length < 2 || baseline.length < 5) continue;
    const recentAvg = recent.reduce((s, l) => s + sevScore(l.severity), 0) / recent.length;
    const baseAvg = baseline.reduce((s, l) => s + sevScore(l.severity), 0) / baseline.length;
    if (baseAvg > 0 && recentAvg / baseAvg >= 1.5) {
      await upsertAlert({
        patientDiseaseId: a.id,
        kind: PredictiveAlertKind.SYMPTOM_SPIKE,
        payload: {
          recentAvgSeverity: Math.round(recentAvg * 100) / 100,
          baselineAvgSeverity: Math.round(baseAvg * 100) / 100,
          recentCount: recent.length,
        },
        severity: recentAvg / baseAvg >= 2 ? Severity.SEVERE : Severity.MODERATE,
        dedupeKey: todayKey(`symptom-spike:${a.id}`),
      });
    }
  }
}

export async function seizureIncrease() {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);
  const fourteenDaysAgo = new Date(Date.now() - 14 * DAY_MS);
  const assignments = await prisma.patientDisease.findMany({
    where: { status: 'ACTIVE', caregiverId: { not: null } },
  });
  for (const a of assignments) {
    if (!a.caregiverId) continue;
    const [recent, previous] = await Promise.all([
      prisma.seizureEvent.count({
        where: { caregiverId: a.caregiverId, occurredAt: { gte: sevenDaysAgo } },
      }),
      prisma.seizureEvent.count({
        where: {
          caregiverId: a.caregiverId,
          occurredAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
    ]);
    if (previous === 0 && recent < 2) continue;
    if (previous === 0 && recent >= 2) {
      await upsertAlert({
        patientDiseaseId: a.id,
        kind: PredictiveAlertKind.SEIZURE_INCREASE,
        payload: { recent, previous, ratio: 'Yeni başlangıç' },
        severity: Severity.SEVERE,
        dedupeKey: todayKey(`seizure-increase:${a.id}`),
      });
      continue;
    }
    if (previous > 0 && recent / previous >= 1.5) {
      await upsertAlert({
        patientDiseaseId: a.id,
        kind: PredictiveAlertKind.SEIZURE_INCREASE,
        payload: { recent, previous, ratio: Math.round((recent / previous) * 100) / 100 },
        severity: recent / previous >= 2 ? Severity.SEVERE : Severity.MODERATE,
        dedupeKey: todayKey(`seizure-increase:${a.id}`),
      });
    }
  }
}

export async function runAllPredictiveJobs() {
  await Promise.all([
    predictStockDepletion(),
    complianceTrend(),
    symptomSpike(),
    seizureIncrease(),
  ]);
}
