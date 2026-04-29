import React from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Heading } from '../../components/Heading';
import { caregiverApi } from '../../api/endpoints';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CaregiverStackParamList } from '../../navigation/CaregiverStack';
import { syncMedicationReminders } from '../../notifications/scheduler';

type Nav = NativeStackNavigationProp<CaregiverStackParamList>;

type DoseEvent = {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  status: 'PENDING' | 'TAKEN_ON_TIME' | 'TAKEN_LATE' | 'MISSED';
};

export function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['today'],
    queryFn: caregiverApi.today,
  });

  const checkDose = useMutation({
    mutationFn: ({ id }: { id: string }) => caregiverApi.checkDose(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  });

  // İlaç hatırlatma bildirimlerini senkronla
  React.useEffect(() => {
    if (!data) return;
    const prescriptions = data.flatMap((d: any) =>
      d.prescriptions.map((p: any) => ({
        id: p.id,
        medicationName: p.medication.name,
        doseAmount: p.doseAmount,
        doseUnit: p.doseUnit,
        scheduleTimes: p.scheduleTimes as string[],
      }))
    );
    syncMedicationReminders(prescriptions).catch(() => undefined);
  }, [data]);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  const allDoses: Array<DoseEvent & { medicationName: string; doseAmount: number; doseUnit: string }> =
    (data ?? []).flatMap((d: any) =>
      d.prescriptions.flatMap((p: any) =>
        (p.doses as DoseEvent[]).map((dose) => ({
          ...dose,
          medicationName: p.medication.name,
          doseAmount: p.doseAmount,
          doseUnit: p.doseUnit,
        }))
      )
    );
  const taken = allDoses.filter((d) => d.status === 'TAKEN_ON_TIME' || d.status === 'TAKEN_LATE').length;

  return (
    <Screen
      scroll={false}
      accessibilityLabel="Bugünün görevleri ekranı"
      contentStyle={{ padding: spacing.lg }}
    >
      <Heading title={`Merhaba ${user?.caregiver?.fullName?.split(' ')[0] ?? ''}`} subtitle="Bugünün Görevleri" />

      <Text style={styles.section} accessibilityRole="header">İlaç Görevleri</Text>
      {allDoses.length === 0 ? (
        <Card>
          <Text style={typography.body}>Bugün için tanımlı ilaç yok.</Text>
        </Card>
      ) : (
        <FlatList
          data={allDoses}
          keyExtractor={(d) => d.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const time = new Date(item.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const isTaken = item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE';
            const isMissed = item.status === 'MISSED';
            const accLabel = `${item.medicationName} ${item.doseAmount} ${item.doseUnit}, saat ${time}, ${
              isTaken ? 'alındı' : isMissed ? 'atlandı' : 'bekliyor'
            }`;
            return (
              <Pressable
                onPress={() => !isTaken && checkDose.mutate({ id: item.id })}
                disabled={isTaken}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTaken, disabled: isTaken }}
                accessibilityLabel={accLabel}
                accessibilityHint={isTaken ? 'Zaten alındı olarak işaretlendi' : 'Aldıysanız tıklayın'}
                style={[styles.doseRow, isTaken && styles.doseRowTaken, isMissed && styles.doseRowMissed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName} allowFontScaling maxFontSizeMultiplier={1.6}>
                    {item.medicationName} {item.doseAmount} {item.doseUnit}
                  </Text>
                  <Text style={styles.medTime} allowFontScaling maxFontSizeMultiplier={1.6}>{time}</Text>
                </View>
                <View
                  style={[styles.tick, isTaken && styles.tickOn, isMissed && styles.tickMissed]}
                  accessibilityElementsHidden
                >
                  <Text style={styles.tickText}>{isTaken ? '✓' : isMissed ? '!' : '○'}</Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer} accessibilityLabel={`Bugün ${taken} / ${allDoses.length} ilaç alındı`}>
              <Text style={styles.progress} allowFontScaling maxFontSizeMultiplier={1.6}>
                {taken} / {allDoses.length} Alındı
              </Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${(taken / Math.max(1, allDoses.length)) * 100}%` }]} />
              </View>
            </View>
          }
        />
      )}

      <Text style={styles.section} accessibilityRole="header">Atanan Hastalıklar</Text>
      <View style={styles.diseaseGrid}>
        {(data ?? []).map((d: any) => (
          <Pressable
            key={d.patientDiseaseId}
            onPress={() => navigation.navigate('DiseaseDetail', { patientDiseaseId: d.patientDiseaseId })}
            accessibilityRole="button"
            accessibilityLabel={`${d.disease.name} hastalığını aç`}
            accessibilityHint="Bugünün semptomları ve ilaçlarını görüntüler"
            style={styles.diseaseCard}
          >
            <Text style={styles.diseaseName} allowFontScaling maxFontSizeMultiplier={1.6}>
              {d.disease.name}
            </Text>
            <Text style={styles.diseaseMeta} allowFontScaling maxFontSizeMultiplier={1.6}>
              {d.symptoms.length} semptom · {d.prescriptions.length} ilaç
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: TOUCH_MIN + 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doseRowTaken: { backgroundColor: colors.successBg, borderColor: colors.success },
  doseRowMissed: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  medName: { ...typography.bodyBold, color: colors.textPrimary },
  medTime: { ...typography.body, color: colors.textSecondary },
  tick: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.success, borderColor: colors.success },
  tickMissed: { backgroundColor: colors.danger, borderColor: colors.danger },
  tickText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: spacing.md },
  progress: { ...typography.bodyBold, color: colors.accent, marginBottom: spacing.xs },
  progressBg: { height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  diseaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  diseaseCard: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_MIN + 30,
  },
  diseaseName: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  diseaseMeta: { ...typography.caption, color: colors.textSecondary },
});
