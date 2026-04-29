import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { ReportPayload } from './aggregator';

const fmtDate = (d: Date) => dayjs(d).format('YYYY-MM-DD');
const fmtDateTime = (d: Date) => dayjs(d).format('YYYY-MM-DD HH:mm');

export async function generateExcel(report: ReportPayload, outPath: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Limitless Care';
  wb.created = new Date();

  // Özet
  const overview = wb.addWorksheet('Özet');
  overview.columns = [
    { header: 'Alan', key: 'k', width: 24 },
    { header: 'Değer', key: 'v', width: 60 },
  ];
  overview.addRows([
    { k: 'Hastalık', v: `${report.disease.name} (${report.disease.category})` },
    { k: 'Dönem', v: `${fmtDate(report.period.start)} → ${fmtDate(report.period.end)}` },
    { k: 'Hasta', v: report.caregiver?.fullName ?? 'Bekleyen kullanıcı' },
    { k: 'Hasta E-posta', v: report.caregiver?.email ?? '-' },
    {
      k: 'Doktor',
      v: report.doctor ? `${report.doctor.title} ${report.doctor.fullName} - ${report.doctor.specialty}` : '-',
    },
    {
      k: 'Son Boy/Kilo',
      v: report.caregiver?.latestMetric
        ? `${report.caregiver.latestMetric.heightCm} cm / ${report.caregiver.latestMetric.weightKg} kg (${fmtDate(
            report.caregiver.latestMetric.recordedAt
          )})`
        : '-',
    },
    { k: 'Genel İlaç Uyumu (%)', v: report.compliance.percent },
    { k: 'Toplam Doz', v: report.compliance.total },
    { k: 'Zamanında', v: report.compliance.onTime },
    { k: 'Geç', v: report.compliance.late },
    { k: 'Atlanan', v: report.compliance.missed },
    { k: 'Bekleyen', v: report.compliance.pending },
  ]);
  overview.getRow(1).font = { bold: true };

  // Semptom özeti
  const symptomSheet = wb.addWorksheet('Semptom Özeti');
  symptomSheet.columns = [
    { header: 'Semptom', key: 'name', width: 32 },
    { header: 'Hafif', key: 'mild', width: 10 },
    { header: 'Orta', key: 'moderate', width: 10 },
    { header: 'Ağır', key: 'severe', width: 10 },
    { header: 'Toplam', key: 'total', width: 10 },
  ];
  symptomSheet.addRows(report.symptomSummary);
  symptomSheet.getRow(1).font = { bold: true };

  // Semptom timeline
  const timeline = wb.addWorksheet('Semptom Zaman Çizelgesi');
  timeline.columns = [
    { header: 'Tarih/Saat', key: 'loggedAt', width: 20 },
    { header: 'Semptom', key: 'symptomName', width: 32 },
    { header: 'Şiddet', key: 'severity', width: 12 },
    { header: 'Not', key: 'note', width: 40 },
  ];
  report.symptomLogs.forEach((s) => {
    timeline.addRow({
      loggedAt: fmtDateTime(s.loggedAt),
      symptomName: s.symptomName,
      severity: s.severity,
      note: s.note ?? '',
    });
  });
  timeline.getRow(1).font = { bold: true };

  // Reçeteler
  const presc = wb.addWorksheet('Reçeteler');
  presc.columns = [
    { header: 'İlaç', key: 'medication', width: 24 },
    { header: 'Doz', key: 'dose', width: 14 },
    { header: 'Saatler', key: 'times', width: 18 },
    { header: 'Talimat', key: 'instructions', width: 24 },
    { header: 'Başlangıç', key: 'startsOn', width: 14 },
    { header: 'Bitiş', key: 'endsOn', width: 14 },
    { header: 'Zamanında', key: 'onTime', width: 12 },
    { header: 'Geç', key: 'late', width: 10 },
    { header: 'Atlanan', key: 'missed', width: 12 },
    { header: 'Bekleyen', key: 'pending', width: 12 },
    { header: 'Toplam', key: 'total', width: 10 },
    { header: 'Uyum %', key: 'pct', width: 10 },
  ];
  report.prescriptions.forEach((p) => {
    presc.addRow({
      medication: p.medication,
      dose: `${p.doseAmount} ${p.doseUnit}`,
      times: p.scheduleTimes.join(', '),
      instructions: p.instructions ?? '',
      startsOn: fmtDate(p.startsOn),
      endsOn: p.endsOn ? fmtDate(p.endsOn) : '',
      onTime: p.stats.onTime,
      late: p.stats.late,
      missed: p.stats.missed,
      pending: p.stats.pending,
      total: p.total,
      pct: p.compliancePercent,
    });
  });
  presc.getRow(1).font = { bold: true };

  // Boy/Kilo geçmişi
  if (report.caregiver?.metrics?.length) {
    const metrics = wb.addWorksheet('Boy-Kilo Geçmişi');
    metrics.columns = [
      { header: 'Tarih', key: 'recordedAt', width: 18 },
      { header: 'Boy (cm)', key: 'heightCm', width: 12 },
      { header: 'Kilo (kg)', key: 'weightKg', width: 12 },
    ];
    report.caregiver.metrics.forEach((m) => {
      metrics.addRow({
        recordedAt: fmtDateTime(m.recordedAt),
        heightCm: m.heightCm,
        weightKg: m.weightKg,
      });
    });
    metrics.getRow(1).font = { bold: true };
  }

  await wb.xlsx.writeFile(outPath);
}
