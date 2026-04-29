import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { caregiverApi } from '../../api/endpoints';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParamList } from '../../navigation/CaregiverStack';

type Props = NativeStackScreenProps<CaregiverStackParamList, 'DiseaseDetail'>;

const SEVERITIES: Array<{ key: 'MILD' | 'MODERATE' | 'SEVERE'; label: string; bg: string; fg: string }> = [
  { key: 'MILD', label: 'Hafif', bg: '#FFF1B8', fg: '#7A5300' },
  { key: 'MODERATE', label: 'Orta', bg: '#FFD9B0', fg: '#7A3F00' },
  { key: 'SEVERE', label: 'Ağır', bg: '#FFC2C2', fg: '#7A0F0F' },
];

export function DiseaseDetailScreen({ route }: Props) {
  const { patientDiseaseId } = route.params;
  const qc = useQueryClient();
  const [pendingSelections, setPendingSelections] = useState<Record<string, 'MILD' | 'MODERATE' | 'SEVERE'>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['today'],
    queryFn: caregiverApi.today,
  });
  const disease = data?.find((d: any) => d.patientDiseaseId === patientDiseaseId);

  const logSymptom = useMutation({
    mutationFn: (body: { symptomId: string; severity: 'MILD' | 'MODERATE' | 'SEVERE' }) =>
      caregiverApi.logSymptom({ patientDiseaseId, ...body }),
  });
  const checkDose = useMutation({
    mutationFn: (id: string) => caregiverApi.checkDose(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  });

  if (isLoading || !disease) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  const submitSymptoms = async () => {
    const entries = Object.entries(pendingSelections);
    if (entries.length === 0) return;
    try {
      await Promise.all(entries.map(([symptomId, severity]) => logSymptom.mutateAsync({ symptomId, severity })));
      setPendingSelections({});
      Alert.alert('Kaydedildi', 'Semptom kayıtları başarıyla iletildi.');
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Kaydedilemedi.');
    }
  };

  return (
    <Screen accessibilityLabel={`${disease.disease.name} detay ekranı`}>
      <Heading title={disease.disease.name} subtitle="Bugünün Semptomları" />

      {disease.symptoms.map((s: any) => {
        const selected = pendingSelections[s.id];
        return (
          <Card key={s.id} accessibilityLabel={`${s.name} semptomu`}>
            <Text style={styles.symptomName} allowFontScaling maxFontSizeMultiplier={1.6}>{s.name}</Text>
            <Text style={styles.symptomDesc} allowFontScaling maxFontSizeMultiplier={1.6}>{s.description}</Text>
            <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={`${s.name} şiddeti`}>
              {SEVERITIES.map((sev) => {
                const active = selected === sev.key;
                return (
                  <Pressable
                    key={sev.key}
                    onPress={() => setPendingSelections((prev) => ({ ...prev, [s.id]: sev.key }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${sev.label} şiddet`}
                    hitSlop={6}
                    style={[styles.sev, { backgroundColor: sev.bg }, active && styles.sevActive]}
                  >
                    <Text style={[styles.sevText, { color: sev.fg }]}>{sev.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        );
      })}

      <PrimaryButton
        label="Semptomları Kaydet"
        accessibilityHint="Seçilen şiddetleri saatli olarak kaydeder"
        onPress={submitSymptoms}
        disabled={Object.keys(pendingSelections).length === 0}
      />

      <Text style={styles.section} accessibilityRole="header">Bugünün İlaçları</Text>
      {disease.prescriptions.length === 0 ? (
        <Card>
          <Text>Bugün için ilaç görevi yok.</Text>
        </Card>
      ) : (
        disease.prescriptions.map((p: any) => (
          <Card key={p.id} accessibilityLabel={`${p.medication.name} ${p.doseAmount} ${p.doseUnit}`}>
            <Text style={styles.medName}>
              {p.medication.name} {p.doseAmount} {p.doseUnit}
            </Text>
            {p.instructions ? <Text style={styles.medMeta}>{p.instructions}</Text> : null}
            <Text style={styles.medMeta}>Saatler: {p.scheduleTimes.join(', ')}</Text>

            {p.doses.map((dose: any) => {
              const time = new Date(dose.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
              const isTaken = dose.status === 'TAKEN_ON_TIME' || dose.status === 'TAKEN_LATE';
              return (
                <Pressable
                  key={dose.id}
                  onPress={() => !isTaken && checkDose.mutate(dose.id)}
                  disabled={isTaken}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isTaken }}
                  accessibilityLabel={`${time} dozu ${isTaken ? 'alındı' : 'henüz alınmadı'}`}
                  style={styles.doseLine}
                >
                  <Text style={styles.doseTime}>{time}</Text>
                  <Text style={[styles.doseStatus, isTaken && { color: colors.success }]}>
                    {isTaken ? '✓ Alındı' : 'İşaretle'}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  symptomName: { ...typography.bodyBold, color: colors.textPrimary },
  symptomDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  sev: {
    flex: 1,
    minHeight: TOUCH_MIN,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sevActive: { borderColor: colors.textPrimary },
  sevText: { ...typography.bodyBold },
  section: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  medName: { ...typography.bodyBold, color: colors.textPrimary },
  medMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  doseLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: TOUCH_MIN,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  doseTime: { ...typography.body, color: colors.textPrimary },
  doseStatus: { ...typography.bodyBold, color: colors.accent },
});
