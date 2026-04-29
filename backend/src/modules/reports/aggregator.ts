import { DoseStatus, Severity } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { syncDoses } from '../caregiver/today.service';

export type ReportPayload = Awaited<ReturnType<typeof buildReportData>>;

export async function buildReportData(params: {
  patientDiseaseId: string;
  periodStart: Date;
  periodEnd: Date;
}) {
  const pd = await prisma.patientDisease.findUnique({
    where: { id: params.patientDiseaseId },
    include: {
      disease: { include: { symptoms: true } },
      doctor: { include: { doctor: true } },
      caregiver: {
        include: {
          user: { select: { email: true } },
          metrics: { orderBy: { recordedAt: 'asc' } },
        },
      },
    },
  });
  if (!pd) throw new Error('Atama bulunamadı');
  if (pd.caregiverId) await syncDoses(pd.caregiverId);

  const symptomLogs = await prisma.symptomLog.findMany({
    where: {
      patientDiseaseId: pd.id,
      loggedAt: { gte: params.periodStart, lte: params.periodEnd },
    },
    include: { symptom: { select: { id: true, name: true } } },
    orderBy: { loggedAt: 'asc' },
  });

  const prescriptions = await prisma.prescription.findMany({
    where: { patientDiseaseId: pd.id },
    include: {
      medication: true,
      doses: {
        where: { scheduledAt: { gte: params.periodStart, lte: params.periodEnd } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Symptom severity dağılımı
  const symptomSummary = new Map<string, { name: string; mild: number; moderate: number; severe: number; total: number }>();
  for (const s of pd.disease.symptoms) {
    symptomSummary.set(s.id, { name: s.name, mild: 0, moderate: 0, severe: 0, total: 0 });
  }
  for (const log of symptomLogs) {
    const entry = symptomSummary.get(log.symptomId) ?? {
      name: log.symptom.name,
      mild: 0,
      moderate: 0,
      severe: 0,
      total: 0,
    };
    if (log.severity === Severity.MILD) entry.mild++;
    else if (log.severity === Severity.MODERATE) entry.moderate++;
    else if (log.severity === Severity.SEVERE) entry.severe++;
    entry.total++;
    symptomSummary.set(log.symptomId, entry);
  }

  // İlaç uyum istatistiği
  let totalDoses = 0;
  let onTime = 0;
  let late = 0;
  let missed = 0;
  let pending = 0;
  const prescriptionStats = prescriptions.map((p) => {
    const stats = { onTime: 0, late: 0, missed: 0, pending: 0 };
    for (const d of p.doses) {
      if (d.status === DoseStatus.TAKEN_ON_TIME) stats.onTime++;
      else if (d.status === DoseStatus.TAKEN_LATE) stats.late++;
      else if (d.status === DoseStatus.MISSED) stats.missed++;
      else stats.pending++;
    }
    totalDoses += p.doses.length;
    onTime += stats.onTime;
    late += stats.late;
    missed += stats.missed;
    pending += stats.pending;
    return {
      id: p.id,
      medication: p.medication.name,
      doseAmount: p.doseAmount,
      doseUnit: p.doseUnit,
      scheduleTimes: p.scheduleTimes,
      instructions: p.instructions,
      startsOn: p.startsOn,
      endsOn: p.endsOn,
      stats,
      total: p.doses.length,
      compliancePercent: p.doses.length === 0 ? 0 : Math.round(((stats.onTime + stats.late) / p.doses.length) * 100),
    };
  });

  const overallCompliance = totalDoses === 0 ? 0 : Math.round(((onTime + late) / totalDoses) * 100);

  return {
    period: { start: params.periodStart, end: params.periodEnd },
    disease: { id: pd.disease.id, name: pd.disease.name, category: pd.disease.category },
    caregiver: pd.caregiver && {
      id: pd.caregiver.userId,
      email: pd.caregiver.user.email,
      fullName: pd.caregiver.fullName,
      gender: pd.caregiver.gender,
      birthDate: pd.caregiver.birthDate,
      latestMetric: pd.caregiver.metrics.at(-1) ?? null,
      metrics: pd.caregiver.metrics,
    },
    doctor: pd.doctor.doctor && {
      fullName: pd.doctor.doctor.fullName,
      title: pd.doctor.doctor.title,
      specialty: pd.doctor.doctor.specialty,
    },
    symptomSummary: Array.from(symptomSummary.values()),
    symptomLogs: symptomLogs.map((s) => ({
      symptomName: s.symptom.name,
      severity: s.severity,
      loggedAt: s.loggedAt,
      note: s.note,
    })),
    prescriptions: prescriptionStats,
    compliance: {
      total: totalDoses,
      onTime,
      late,
      missed,
      pending,
      percent: overallCompliance,
    },
    patientDiseaseId: pd.id,
    doctorId: pd.doctorId,
    caregiverId: pd.caregiverId,
  };
}
