import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { catalogApi, doctorApi } from '../../api/endpoints';
import { colors, radius, spacing, typography } from '../../theme';

const CATEGORIES = [
  { key: 'MENTAL_DEVELOPMENTAL', label: 'Zihinsel-Gelişimsel' },
  { key: 'MENTAL_HEALTH', label: 'Ruh Sağlığı' },
  { key: 'NEURO_PHYSICAL', label: 'Nörolojik-Fiziksel' },
  { key: 'SENSORY', label: 'Duyusal' },
  { key: 'CHRONIC', label: 'Kronik' },
];

export function CatalogManageScreen() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState<string | null>(null);

  const { data: diseases, isLoading } = useQuery({
    queryKey: ['catalog-diseases', null],
    queryFn: () => catalogApi.diseases(),
  });

  const [diseaseForm, setDiseaseForm] = useState({
    name: '',
    category: 'CHRONIC',
    description: '',
  });

  const createDisease = useMutation({
    mutationFn: () => doctorApi.createDisease(diseaseForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog-diseases'] });
      setDiseaseForm({ name: '', category: 'CHRONIC', description: '' });
      Alert.alert('Hastalık eklendi', 'Yeni hastalık atama listesinde görünecek.');
    },
    onError: (e: any) => setError(e?.message ?? 'Hastalık eklenemedi.'),
  });

  return (
    <Screen accessibilityLabel="Katalog yönetim ekranı">
      <Heading title="Hastalık & Semptom Yönetimi" subtitle="Sisteme yeni hastalık veya semptom ekleyin" />
      <ErrorBanner message={error} />

      <Card accessibilityLabel="Yeni hastalık ekleme formu">
        <Text style={styles.section} accessibilityRole="header">Yeni Hastalık</Text>
        <TextField label="Ad" value={diseaseForm.name} onChangeText={(v) => setDiseaseForm((s) => ({ ...s, name: v }))} hint="Hastalık adı" />
        <Text style={styles.miniLabel}>Kategori</Text>
        <View style={styles.row}>
          {CATEGORIES.map((c) => {
            const active = diseaseForm.category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setDiseaseForm((s) => ({ ...s, category: c.key }))}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={c.label}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextField
          label="Açıklama"
          value={diseaseForm.description}
          onChangeText={(v) => setDiseaseForm((s) => ({ ...s, description: v }))}
          multiline
          numberOfLines={3}
          hint="Hastalığın kısa tanımı"
        />
        <PrimaryButton
          label="Hastalık Ekle"
          loading={createDisease.isPending}
          disabled={!diseaseForm.name || !diseaseForm.description}
          onPress={() => createDisease.mutate()}
        />
      </Card>

      <Text style={styles.section} accessibilityRole="header">Mevcut Hastalıklar</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={diseases ?? []}
          keyExtractor={(d: any) => d.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <DiseaseRow
              disease={item}
              expanded={selectedDiseaseId === item.id}
              onToggle={() => setSelectedDiseaseId(selectedDiseaseId === item.id ? null : item.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function DiseaseRow({
  disease,
  expanded,
  onToggle,
}: {
  disease: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const [symptomForm, setSymptomForm] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);

  const { data: symptoms } = useQuery({
    queryKey: ['symptoms', disease.id],
    queryFn: () => catalogApi.diseaseSymptoms(disease.id),
    enabled: expanded,
  });

  const addSymptom = useMutation({
    mutationFn: () => doctorApi.addSymptom(disease.id, symptomForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['symptoms', disease.id] });
      qc.invalidateQueries({ queryKey: ['catalog-diseases'] });
      setSymptomForm({ name: '', description: '' });
    },
    onError: (e: any) => setError(e?.message ?? 'Semptom eklenemedi.'),
  });

  return (
    <Card accessibilityLabel={`${disease.name}, ${disease._count?.symptoms ?? 0} semptom`}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${disease.name} detayını ${expanded ? 'kapat' : 'aç'}`}
        accessibilityState={{ expanded }}
      >
        <Text style={styles.diseaseName}>{disease.name}</Text>
        <Text style={styles.diseaseMeta}>
          {disease.category} · {disease._count?.symptoms ?? 0} semptom {disease.isSystem ? '· Sistem' : '· Özel'}
        </Text>
      </Pressable>
      {expanded ? (
        <View style={{ marginTop: spacing.md }}>
          <ErrorBanner message={error} />
          <Text style={styles.miniLabel}>Yeni Semptom Ekle</Text>
          <TextField
            label="Semptom adı"
            value={symptomForm.name}
            onChangeText={(v) => setSymptomForm((s) => ({ ...s, name: v }))}
          />
          <TextField
            label="Açıklama"
            value={symptomForm.description}
            onChangeText={(v) => setSymptomForm((s) => ({ ...s, description: v }))}
            multiline
            numberOfLines={2}
          />
          <PrimaryButton
            label="Semptom Ekle"
            loading={addSymptom.isPending}
            disabled={!symptomForm.name || !symptomForm.description}
            onPress={() => addSymptom.mutate()}
          />
          <Text style={[styles.miniLabel, { marginTop: spacing.md }]}>Mevcut Semptomlar</Text>
          {(symptoms ?? []).map((s: any) => (
            <View key={s.id} style={styles.symptomLine}>
              <Text style={styles.symptomName}>{s.name}</Text>
              <Text style={styles.symptomDesc}>{s.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  miniLabel: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs, marginTop: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...typography.body, color: colors.textPrimary },
  chipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  diseaseName: { ...typography.bodyBold, color: colors.textPrimary },
  diseaseMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  symptomLine: { paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  symptomName: { ...typography.bodyBold, color: colors.textPrimary },
  symptomDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
