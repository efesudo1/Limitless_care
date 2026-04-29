import PDFDocument from 'pdfkit';
import fs from 'fs';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import { ReportPayload } from './aggregator';

dayjs.locale('tr');

const fmt = (d: Date) => dayjs(d).format('DD MMM YYYY');
const fmtDt = (d: Date) => dayjs(d).format('DD MMM YYYY HH:mm');

export async function generatePdf(report: ReportPayload, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(outPath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.pipe(stream);

    // Başlık
    doc.fontSize(20).fillColor('#0f172a').text('Limitless Care - Hasta Takip Raporu', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#475569').text(
      `Donem: ${fmt(report.period.start)} - ${fmt(report.period.end)}`,
      { align: 'center' }
    );
    doc.moveDown(1);

    // Hasta bilgisi
    doc.fontSize(13).fillColor('#0f172a').text('Hasta Bilgileri', { underline: true });
    doc.fontSize(10).fillColor('#1e293b');
    if (report.caregiver) {
      doc.text(`Ad Soyad: ${report.caregiver.fullName}`);
      doc.text(`E-posta: ${report.caregiver.email}`);
      doc.text(`Cinsiyet: ${report.caregiver.gender}`);
      doc.text(`Dogum Tarihi: ${fmt(report.caregiver.birthDate)}`);
      if (report.caregiver.latestMetric) {
        doc.text(
          `Son olcum: ${report.caregiver.latestMetric.heightCm} cm / ${report.caregiver.latestMetric.weightKg} kg (${fmt(
            report.caregiver.latestMetric.recordedAt
          )})`
        );
      }
    } else {
      doc.text('Hasta henuz hesabini aktiflestirmemis (e-posta ile bekleyen atama).');
    }
    doc.moveDown(0.5);

    // Doktor
    if (report.doctor) {
      doc.fontSize(13).fillColor('#0f172a').text('Takip Eden Doktor', { underline: true });
      doc.fontSize(10).fillColor('#1e293b');
      doc.text(`${report.doctor.title} ${report.doctor.fullName} - ${report.doctor.specialty}`);
      doc.moveDown(0.5);
    }

    // Hastalık
    doc.fontSize(13).fillColor('#0f172a').text('Hastalik', { underline: true });
    doc.fontSize(10).fillColor('#1e293b').text(`${report.disease.name} (${report.disease.category})`);
    doc.moveDown(0.5);

    // Semptom Özeti
    doc.fontSize(13).fillColor('#0f172a').text('Semptom Siddeti Dagilimi', { underline: true });
    doc.fontSize(10).fillColor('#1e293b');
    if (report.symptomSummary.length === 0 || report.symptomLogs.length === 0) {
      doc.text('Bu donemde semptom kaydi yok.');
    } else {
      report.symptomSummary
        .filter((s) => s.total > 0)
        .forEach((s) => {
          doc.text(
            `- ${s.name}: Hafif ${s.mild}, Orta ${s.moderate}, Agir ${s.severe} (toplam ${s.total})`
          );
        });
    }
    doc.moveDown(0.5);

    // Reçete uyum
    doc.fontSize(13).fillColor('#0f172a').text('Ilac Kullanim Uyumu', { underline: true });
    doc.fontSize(10).fillColor('#1e293b');
    doc.text(`Genel uyum: %${report.compliance.percent}`);
    doc.text(
      `Toplam doz: ${report.compliance.total}, Zamaninda: ${report.compliance.onTime}, Gec: ${report.compliance.late}, Atlanan: ${report.compliance.missed}, Bekleyen: ${report.compliance.pending}`
    );
    doc.moveDown(0.3);
    if (report.prescriptions.length === 0) {
      doc.text('Bu donemde recete kaydi yok.');
    } else {
      report.prescriptions.forEach((p) => {
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor('#0f172a').text(`${p.medication} ${p.doseAmount} ${p.doseUnit}`);
        doc.fontSize(10).fillColor('#1e293b');
        doc.text(`Saatler: ${p.scheduleTimes.join(', ')}${p.instructions ? ' - ' + p.instructions : ''}`);
        doc.text(
          `Uyum: %${p.compliancePercent} | Zamaninda: ${p.stats.onTime}, Gec: ${p.stats.late}, Atlanan: ${p.stats.missed}, Bekleyen: ${p.stats.pending}, Toplam: ${p.total}`
        );
      });
    }
    doc.moveDown(0.5);

    // Semptom timeline
    if (report.symptomLogs.length > 0) {
      doc.addPage();
      doc.fontSize(13).fillColor('#0f172a').text('Semptom Zaman Cizelgesi', { underline: true });
      doc.fontSize(9).fillColor('#1e293b');
      report.symptomLogs.forEach((s) => {
        doc.text(`${fmtDt(s.loggedAt)} - ${s.symptomName} - ${s.severity}${s.note ? ' - ' + s.note : ''}`);
      });
    }

    // Footer
    doc.moveDown(1);
    doc
      .fontSize(8)
      .fillColor('#94a3b8')
      .text(`Olusturuldu: ${fmtDt(new Date())}`, { align: 'right' });

    doc.end();
  });
}
