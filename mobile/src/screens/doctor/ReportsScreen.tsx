import React, { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { doctorApi, reportsApi } from '../../api/endpoints';
import { storage } from '../../auth/storage';
import { api } from '../../api/client';
import { colors, radius, spacing, typography } from '../../theme';

export function ReportsScreen() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [weeklyPreview, setWeeklyPreview] = useState<any | null>(null);

  const { data: reports, isLoading } = useQuery({ queryKey: ['reports'], queryFn: reportsApi.list });
  const { data: patients } = useQuery({ queryKey: ['doctor-patients'], queryFn: doctorApi.patients });

  const fetchWeekly = useMutation({
    mutationFn: (patientDiseaseId: string) => reportsApi.weekly(patientDiseaseId),
    onSuccess: (data) => setWeeklyPreview(data),
    onError: (e: any) => setError(e?.message ?? 'Haftalık rapor alınamadı.'),
  });

  const generate = useMutation({
    mutationFn: ({ patientDiseaseId, format }: { patientDiseaseId: string; format: 'PDF' | 'EXCEL' }) =>
      reportsApi.generate({
        patientDiseaseId,
        periodStart: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        format,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
    onError: (e: any) => setError(e?.message ?? 'Rapor üretilemedi.'),
  });

  const download = async (id: string) => {
    const token = await storage.getAccessToken();
    const url = `${api.defaults.baseURL}/reports/${id}/download`;
    Linking.openURL(`${url}?t=${token}`).catch(() => setError('Tarayıcı açılamadı.'));
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen accessibilityLabel="Raporlar ekranı">
      <Heading title="Raporlar" subtitle="Son 30 günü PDF veya Excel olarak indirin" />
      <ErrorBanner message={error} />

      <Text style={styles.section} accessibilityRole="header">Yeni Rapor Oluştur</Text>
      {(patients ?? []).map((p: any) =>
        p.diseases.map((d: any) => (
          <Card key={d.id} accessibilityLabel={`${p.fullName ?? p.caregiverEmail} ${d.name}`}>
            <Text style={styles.name}>{p.fullName ?? p.caregiverEmail}</Text>
            <Text style={styles.meta}>{d.name}</Text>
            <View style={styles.btnRow}>
              <Pressable
                onPress={() => {
                  setGeneratingId(d.id + '-pdf');
                  generate.mutate(
                    { patientDiseaseId: d.id, format: 'PDF' },
                    { onSettled: () => setGeneratingId(null) }
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="PDF rapor üret"
                style={[styles.btn, { borderColor: colors.danger }]}
              >
                <Text style={[styles.btnText, { color: colors.danger }]}>
                  {generatingId === d.id + '-pdf' ? '...' : 'PDF Oluştur'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setGeneratingId(d.id + '-xlsx');
                  generate.mutate(
                    { patientDiseaseId: d.id, format: 'EXCEL' },
                    { onSettled: () => setGeneratingId(null) }
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Excel rapor üret"
                style={[styles.btn, { borderColor: colors.success }]}
              >
                <Text style={[styles.btnText, { color: colors.success }]}>
                  {generatingId === d.id + '-xlsx' ? '...' : 'Excel Oluştur'}
                </Text>
              </Pressable>
            </View>
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              variant="secondary"
              label="Haftalık Karne Görüntüle"
              accessibilityHint="Son 7 gün için korelasyon analizi ve içgörüler"
              onPress={() => fetchWeekly.mutate(d.id)}
              loading={fetchWeekly.isPending && fetchWeekly.variables === d.id}
            />
          </Card>
        ))
      )}

      {weeklyPreview ? (
        <Card accessibilityLabel="Haftalık Sağlık Karnesi">
          <Text style={styles.name}>
            Haftalık Karne — {weeklyPreview.disease?.name}
            {weeklyPreview.caregiver?.fullName ? ` · ${weeklyPreview.caregiver.fullName}` : ''}
          </Text>
          <Text style={styles.meta}>
            {new Date(weeklyPreview.period.start).toLocaleDateString('tr-TR')} -
            {' '}
            {new Date(weeklyPreview.period.end).toLocaleDateString('tr-TR')}
          </Text>
          <View style={{ height: spacing.sm }} />
          <Text style={styles.meta}>İlaç Uyumu: %{weeklyPreview.compliance.percent}</Text>
          <Text style={styles.meta}>Toplam Semptom Kaydı: {weeklyPreview.symptomLogs.length}</Text>

          <Text style={[styles.section, { marginTop: spacing.sm }]} accessibilityRole="header">
            İçgörüler
          </Text>
          {(weeklyPreview.correlations?.insights ?? []).map((ins: string, idx: number) => (
            <Text key={idx} style={styles.insight}>
              • {ins}
            </Text>
          ))}

          <Text style={[styles.section, { marginTop: spacing.sm }]} accessibilityRole="header">
            Haftanın Günleri (semptom)
          </Text>
          {Object.entries(weeklyPreview.correlations?.symptomByDayOfWeek ?? {}).map(([day, count]) => (
            <Text key={day} style={styles.meta}>
              {day}: {count as number}
            </Text>
          ))}

          {weeklyPreview.correlations?.insights?.length ? null : null}
          <View style={{ height: spacing.md }} />
          <PrimaryButton variant="ghost" label="Kapat" onPress={() => setWeeklyPreview(null)} />
        </Card>
      ) : null}

      <Text style={styles.section} accessibilityRole="header">Geçmiş Raporlar</Text>
      {(reports ?? []).map((r: any) => (
        <Card key={r.id}>
          <Text style={styles.name}>
            {r.patientDisease.caregiver?.fullName ?? '-'} • {r.patientDisease.disease.name}
          </Text>
          <Text style={styles.meta}>
            {new Date(r.periodStart).toLocaleDateString('tr-TR')} - {new Date(r.periodEnd).toLocaleDateString('tr-TR')}
          </Text>
          <Text style={styles.meta}>{r.format} · {new Date(r.generatedAt).toLocaleString('tr-TR')}</Text>
          <PrimaryButton variant="secondary" label={`${r.format} İndir`} onPress={() => download(r.id)} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  name: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  btnText: { ...typography.bodyBold },
  insight: { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs },
});
