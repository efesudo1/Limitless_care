import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../api/endpoints';
import { colors, radius, spacing, typography } from '../theme';

const KIND_LABELS: Record<string, string> = {
  LOW_STOCK: 'Stok azalıyor',
  COMPLIANCE_DROP: 'İlaç uyumu düştü',
  SYMPTOM_SPIKE: 'Semptomlar arttı',
  SEIZURE_INCREASE: 'Nöbet sıklığı arttı',
};

const SEVERITY_BG: Record<string, string> = {
  MILD: colors.warningBg,
  MODERATE: colors.warningBg,
  SEVERE: colors.dangerBg,
};

const SEVERITY_BORDER: Record<string, string> = {
  MILD: colors.warning,
  MODERATE: colors.warning,
  SEVERE: colors.danger,
};

function summarize(alert: any): string {
  const p = alert.payload ?? {};
  switch (alert.kind) {
    case 'LOW_STOCK':
      return `${p.medicationName ?? 'İlaç'}: ${p.remaining} kaldı (~${p.daysRemaining} gün)`;
    case 'COMPLIANCE_DROP':
      return `Son 7 gün uyum %${p.recentPct} (önceki %${p.previousPct}, ${p.dropPct}p düşüş)`;
    case 'SYMPTOM_SPIKE':
      return `Son 3 gün ortalama şiddet ${p.recentAvgSeverity} (baseline ${p.baselineAvgSeverity})`;
    case 'SEIZURE_INCREASE':
      return `Son 7 gün ${p.recent} nöbet (önceki dönem ${p.previous})`;
    default:
      return JSON.stringify(p);
  }
}

type Props = {
  audience: 'caregiver' | 'doctor';
};

export function AlertBanner({ audience }: Props) {
  const qc = useQueryClient();
  const queryKey = audience === 'caregiver' ? 'me-alerts' : 'doctor-alerts';
  const fetcher = audience === 'caregiver' ? alertsApi.myAlerts : alertsApi.doctorAlerts;
  const reader = audience === 'caregiver' ? alertsApi.markCaregiverRead : alertsApi.markDoctorRead;

  const { data } = useQuery<any[]>({
    queryKey: [queryKey],
    queryFn: () => fetcher(true),
  });
  const mark = useMutation({
    mutationFn: (id: string) => reader(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
  });

  const list = (data ?? []).slice(0, 3);
  if (list.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading} accessibilityRole="header">
        Sağlık Uyarıları ({data?.length ?? 0})
      </Text>
      {list.map((alert: any) => {
        const patientName = alert.patientDisease?.caregiver?.fullName;
        const diseaseName = alert.patientDisease?.disease?.name;
        return (
          <View
            key={alert.id}
            style={[
              styles.card,
              {
                backgroundColor: SEVERITY_BG[alert.severity] ?? colors.warningBg,
                borderColor: SEVERITY_BORDER[alert.severity] ?? colors.warning,
              },
            ]}
            accessibilityLabel={`${KIND_LABELS[alert.kind] ?? alert.kind} - ${summarize(alert)}`}
            accessibilityRole="alert"
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {KIND_LABELS[alert.kind] ?? alert.kind}
                {audience === 'doctor' && patientName ? ` · ${patientName}` : ''}
                {audience === 'doctor' && diseaseName ? ` (${diseaseName})` : ''}
              </Text>
              <Text style={styles.body}>{summarize(alert)}</Text>
              <Text style={styles.meta}>{new Date(alert.createdAt).toLocaleString('tr-TR')}</Text>
            </View>
            <Pressable
              onPress={() => mark.mutate(alert.id)}
              accessibilityRole="button"
              accessibilityLabel="Okundu olarak işaretle"
              hitSlop={12}
              style={styles.dismissBtn}
            >
              <Text style={styles.dismissText}>Tamam</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  heading: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  title: { ...typography.bodyBold, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  dismissBtn: {
    minWidth: 60,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: { ...typography.bodyBold, color: colors.textPrimary },
});
