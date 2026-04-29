import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { catalogApi, doctorApi } from '../../api/endpoints';
import { colors, radius, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Props = NativeStackScreenProps<DoctorStackParamList, 'AssignDisease'>;

const CATEGORIES = [
  { key: 'MENTAL_DEVELOPMENTAL', label: 'Zihinsel-Gelişimsel' },
  { key: 'MENTAL_HEALTH', label: 'Ruh Sağlığı' },
  { key: 'NEURO_PHYSICAL', label: 'Nörolojik-Fiziksel' },
  { key: 'SENSORY', label: 'Duyusal' },
  { key: 'CHRONIC', label: 'Kronik' },
];

export function AssignDiseaseScreen({ navigation, route }: Props) {
  const qc = useQueryClient();
  const [email, setEmail] = useState(route.params?.caregiverEmail ?? '');
  const [category, setCategory] = useState<string | null>(null);
  const [diseaseId, setDiseaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: diseases, isLoading } = useQuery({
    queryKey: ['catalog-diseases', category],
    queryFn: () => catalogApi.diseases(category ?? undefined),
  });

  const assign = useMutation({
    mutationFn: () => doctorApi.assign(email, diseaseId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-patients'] });
      Alert.alert('Atandı', 'Hastalık başarıyla atandı.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    },
    onError: (e: any) => setError(e?.message ?? 'Atama başarısız.'),
  });

  return (
    <Screen scroll={false} accessibilityLabel="Hastalık atama ekranı" contentStyle={{ padding: spacing.lg }}>
      <Heading title="Yeni Hastalık Ataması" subtitle="Hasta e-postasını ve hastalığı seçin" />
      <ErrorBanner message={error} />
      <TextField
        label="Hasta E-postası"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        hint="Hasta sisteme kayıt olmamışsa kayıt anında otomatik aktiflesir"
      />
      <Text style={styles.section} accessibilityRole="header">Kategori</Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => {
                setCategory(active ? null : c.key);
                setDiseaseId(null);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.label}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section} accessibilityRole="header">Hastalık</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={diseases ?? []}
          keyExtractor={(d: any) => d.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const active = diseaseId === item.id;
            return (
              <Pressable
                onPress={() => setDiseaseId(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.name}, ${item._count.symptoms} semptom`}
                style={[styles.item, active && styles.itemActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.category} · {item._count.symptoms} semptom
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <PrimaryButton
        label="Hastalığı Ata"
        loading={assign.isPending}
        disabled={!email || !diseaseId}
        accessibilityHint="Seçilen hastalığı girilen e-postaya atar"
        onPress={() => assign.mutate()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...typography.body, color: colors.textPrimary },
  chipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  item: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  itemActive: { borderColor: colors.accent, backgroundColor: '#E0EAFE' },
  itemName: { ...typography.bodyBold, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
