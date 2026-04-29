import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SeverityChart } from '../../components/SeverityChart';
import { doctorApi } from '../../api/endpoints';
import { colors, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Props = NativeStackScreenProps<DoctorStackParamList, 'PatientDetail'>;

export function PatientDetailScreen({ route, navigation }: Props) {
  const { patientDiseaseId } = route.params;
  const { data, isLoading } = useQuery({
    queryKey: ['timeline', patientDiseaseId],
    queryFn: () => doctorApi.timeline(patientDiseaseId),
  });

  if (isLoading || !data) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  // Semptom katalog × log → severity dağılımı
  const severityRows = data.assignment.symptomCatalog.map((s: any) => {
    const logs = data.symptomLogs.filter((l: any) => l.symptom?.id === s.id || l.symptomId === s.id);
    return {
      symptomId: s.id,
      symptomName: s.name,
      mild: logs.filter((l: any) => l.severity === 'MILD').length,
      moderate: logs.filter((l: any) => l.severity === 'MODERATE').length,
      severe: logs.filter((l: any) => l.severity === 'SEVERE').length,
    };
  });

  const compliance = (() => {
    let total = 0;
    let ok = 0;
    data.prescriptions.forEach((p: any) => {
      p.doses.forEach((d: any) => {
        total++;
        if (d.status === 'TAKEN_ON_TIME' || d.status === 'TAKEN_LATE') ok++;
      });
    });
    return total === 0 ? 0 : Math.round((ok / total) * 100);
  })();

  return (
    <Screen accessibilityLabel="Hasta detay ekranı">
      <Heading
        title={data.caregiver?.fullName ?? data.assignment.disease.name}
        subtitle={`${data.assignment.disease.name} (${data.assignment.disease.category})`}
      />

      {data.caregiver ? (
        <Card>
          <Text style={styles.k}>Hasta Bilgileri</Text>
          <Text style={styles.v}>{data.caregiver.email}</Text>
          <Text style={styles.v}>Cinsiyet: {data.caregiver.gender}</Text>
          {data.caregiver.metrics?.length ? (
            <Text style={styles.v}>
              Son ölçüm: {data.caregiver.metrics.at(-1).heightCm} cm / {data.caregiver.metrics.at(-1).weightKg} kg
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text style={styles.v}>Hasta henüz hesabını aktiflestirmedi (e-posta ile bekleyen atama).</Text>
        </Card>
      )}

      <Card>
        <Text style={styles.k}>İlaç Uyumu</Text>
        <Text style={[styles.v, { fontSize: 28, fontWeight: '700', color: colors.accent }]}>%{compliance}</Text>
      </Card>

      <Card>
        <Text style={styles.k}>Semptom Şiddet Dağılımı</Text>
        <SeverityChart data={severityRows} caption="Bu hastalık için semptom şiddet dağılımı grafiği" />
      </Card>

      <Card>
        <Text style={styles.k}>Son Semptom Kayıtları</Text>
        {data.symptomLogs.length === 0 ? (
          <Text style={styles.v}>Henüz semptom kaydı yok.</Text>
        ) : (
          data.symptomLogs.slice(-10).reverse().map((s: any, idx: number) => (
            <View key={idx} style={styles.line}>
              <Text style={styles.v}>
                {new Date(s.loggedAt).toLocaleString('tr-TR')} — {s.symptom.name} — {s.severity}
              </Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Text style={styles.k}>Reçeteler</Text>
        {data.prescriptions.length === 0 ? (
          <Text style={styles.v}>Henüz reçete yok.</Text>
        ) : (
          data.prescriptions.map((p: any) => (
            <View key={p.id} style={styles.line}>
              <Text style={styles.v}>
                {p.medication.name} {p.doseAmount} {p.doseUnit} — {p.scheduleTimes.join(', ')}
              </Text>
            </View>
          ))
        )}
      </Card>

      <PrimaryButton
        label="Yeni Reçete Ekle"
        accessibilityHint="Bu hastalığa ilaç reçetesi ekler"
        onPress={() => navigation.navigate('PrescriptionForm', { patientDiseaseId })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  k: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  v: { ...typography.body, color: colors.textSecondary },
  line: { marginBottom: spacing.xs },
});
