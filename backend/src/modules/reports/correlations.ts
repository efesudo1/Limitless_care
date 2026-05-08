import { ReportPayload } from './aggregator';
import { prisma } from '../../lib/prisma';

const TR_DAY_LABELS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export type CorrelationPayload = {
  symptomByDayOfWeek: Record<string, number>;
  symptomByHour: Record<string, number>;
  seizureByDayOfWeek: Record<string, number>;
  seizureByHour: Record<string, number>;
  complianceVsSeverity: Array<{ range: string; avgSeverity: number; sampleSize: number }>;
  insights: string[];
};

function emptyDayMap(): Record<string, number> {
  return TR_DAY_LABELS.reduce<Record<string, number>>((acc, l) => {
    acc[l] = 0;
    return acc;
  }, {});
}

function emptyHourMap(): Record<string, number> {
  const m: Record<string, number> = {};
  for (let h = 0; h < 24; h++) m[String(h).padStart(2, '0')] = 0;
  return m;
}

function severityScore(sev: 'MILD' | 'MODERATE' | 'SEVERE'): number {
  return sev === 'MILD' ? 1 : sev === 'MODERATE' ? 2 : 3;
}

export async function buildCorrelations(payload: ReportPayload): Promise<CorrelationPayload> {
  const symptomByDayOfWeek = emptyDayMap();
  const symptomByHour = emptyHourMap();
  for (const log of payload.symptomLogs) {
    const d = new Date(log.loggedAt);
    symptomByDayOfWeek[TR_DAY_LABELS[d.getDay()]] += 1;
    symptomByHour[String(d.getHours()).padStart(2, '0')] += 1;
  }

  // Nöbet verileri (caregiver bazında, period içinde)
  const seizureByDayOfWeek = emptyDayMap();
  const seizureByHour = emptyHourMap();
  if (payload.caregiverId) {
    const seizures = await prisma.seizureEvent.findMany({
      where: {
        caregiverId: payload.caregiverId,
        occurredAt: { gte: payload.period.start, lte: payload.period.end },
      },
    });
    for (const s of seizures) {
      const d = new Date(s.occurredAt);
      seizureByDayOfWeek[TR_DAY_LABELS[d.getDay()]] += 1;
      seizureByHour[String(d.getHours()).padStart(2, '0')] += 1;
    }
  }

  // Uyum % aralıkları için ortalama severity
  // Reçete uyum %'sini logların gününe atfetmek karmaşık; basit yaklaşım:
  // overall uyum % bandını belirleyip log severity'lerinin ortalamasını veriyoruz.
  const ranges = [
    { range: '0-50%', min: 0, max: 50 },
    { range: '50-80%', min: 50, max: 80 },
    { range: '80-100%', min: 80, max: 100 },
  ];
  const overall = payload.compliance.percent;
  const avgSeverity =
    payload.symptomLogs.length === 0
      ? 0
      : payload.symptomLogs.reduce((a, l) => a + severityScore(l.severity as any), 0) /
        payload.symptomLogs.length;
  const complianceVsSeverity = ranges.map((r) => ({
    range: r.range,
    avgSeverity: overall >= r.min && overall <= r.max ? Math.round(avgSeverity * 100) / 100 : 0,
    sampleSize: overall >= r.min && overall <= r.max ? payload.symptomLogs.length : 0,
  }));

  // İçgörüler
  const insights: string[] = [];
  const peakDay = Object.entries(symptomByDayOfWeek).reduce((a, b) => (b[1] > a[1] ? b : a));
  if (peakDay[1] > 0) {
    insights.push(`Bu dönemde semptomlar en sık ${peakDay[0]} günleri kaydedildi (${peakDay[1]} kayıt).`);
  }
  const peakHour = Object.entries(symptomByHour).reduce((a, b) => (b[1] > a[1] ? b : a));
  if (peakHour[1] > 0) {
    insights.push(`Yoğun semptom saatleri ${peakHour[0]}:00 civarında.`);
  }
  insights.push(
    overall >= 80
      ? `İlaç uyumu %${overall} ile yüksek; tedaviye düzenli devam ediliyor.`
      : overall >= 50
      ? `İlaç uyumu %${overall}. Daha düzenli kullanım için hatırlatıcılar yararlı olabilir.`
      : `İlaç uyumu %${overall} ile düşük. Sebepleri konuşmak önerilir.`
  );

  // Nöbet pik günü ek içgörü
  const seizurePeak = Object.entries(seizureByDayOfWeek).reduce((a, b) => (b[1] > a[1] ? b : a));
  if (seizurePeak[1] > 0) {
    insights.push(`Nöbetler en sık ${seizurePeak[0]} günleri görüldü.`);
  }

  return {
    symptomByDayOfWeek,
    symptomByHour,
    seizureByDayOfWeek,
    seizureByHour,
    complianceVsSeverity,
    insights: insights.slice(0, 4),
  };
}

export async function buildWeeklyReport(patientDiseaseId: string, weekStart?: Date) {
  const start = weekStart ? new Date(weekStart) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  const { buildReportData } = await import('./aggregator');
  const payload = await buildReportData({ patientDiseaseId, periodStart: start, periodEnd: end });
  const correlations = await buildCorrelations(payload);
  return { ...payload, correlations };
}
