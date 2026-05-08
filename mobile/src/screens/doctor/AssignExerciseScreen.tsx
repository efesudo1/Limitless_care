import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { doctorApi } from '../../api/endpoints';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Props = NativeStackScreenProps<DoctorStackParamList, 'AssignExercise'>;

const PRESET_TIMES = ['08:00', '12:00', '14:00', '18:00', '20:00'];

type Exercise = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  videoUrl?: string | null;
  isSystem: boolean;
};

type ExercisePlan = {
  id: string;
  exerciseId: string;
  scheduleTimes: string[];
  active: boolean;
  exercise: Exercise;
  completions: { id: string; completedAt: string }[];
};

export function AssignExerciseScreen({ route, navigation }: Props) {
  const qc = useQueryClient();
  const { patientDiseaseId } = route.params;
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [times, setTimes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', description: '', durationMin: '5' });

  const { data: exercises, isLoading: loadingEx } = useQuery<Exercise[]>({
    queryKey: ['doctor-exercises'],
    queryFn: doctorApi.exercises,
  });

  const { data: plans } = useQuery<ExercisePlan[]>({
    queryKey: ['exercise-plans', patientDiseaseId],
    queryFn: () => doctorApi.patientExercisePlans(patientDiseaseId),
  });

  const createPlan = useMutation({
    mutationFn: () =>
      doctorApi.createExercisePlan({
        patientDiseaseId,
        exerciseId: exerciseId!,
        scheduleTimes: times,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise-plans', patientDiseaseId] });
      Alert.alert('Plan oluşturuldu', 'Hasta uygulamasında günlük görev olarak görünecek.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (e: any) => setError(e?.message ?? 'Plan oluşturulamadı'),
  });

  const createExercise = useMutation({
    mutationFn: () =>
      doctorApi.createExercise({
        name: customForm.name.trim(),
        description: customForm.description.trim(),
        durationMin: Number(customForm.durationMin) || 5,
      }),
    onSuccess: (created: Exercise) => {
      qc.invalidateQueries({ queryKey: ['doctor-exercises'] });
      setExerciseId(created.id);
      setShowCustom(false);
      setCustomForm({ name: '', description: '', durationMin: '5' });
    },
    onError: (e: any) => setError(e?.message ?? 'Egzersiz eklenemedi'),
  });

  const togglePlan = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      doctorApi.setExercisePlanActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise-plans', patientDiseaseId] }),
  });

  const submit = () => {
    if (!exerciseId) {
      setError('Bir egzersiz seçin.');
      return;
    }
    if (times.length === 0) {
      setError('En az bir saat seçin.');
      return;
    }
    setError(null);
    createPlan.mutate();
  };

  const submitCustom = () => {
    if (!customForm.name.trim() || !customForm.description.trim()) {
      setError('Ad ve açıklama zorunlu.');
      return;
    }
    setError(null);
    createExercise.mutate();
  };

  return (
    <Screen accessibilityLabel="Egzersiz atama ekranı">
      <Heading title="Egzersiz Ata" subtitle="Hastaya günlük fizik tedavi planı oluşturun" />
      <ErrorBanner message={error} />

      {(plans?.length ?? 0) > 0 ? (
        <Card accessibilityLabel="Hastanın mevcut egzersiz planları">
          <Text style={styles.sectionTitle}>Mevcut Planlar</Text>
          {plans!.map((p) => (
            <View key={p.id} style={styles.planRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{p.exercise.name}</Text>
                <Text style={styles.planMeta}>
                  {p.scheduleTimes.join(', ')} · son 30 günde {p.completions.length} kez tamamlandı
                </Text>
              </View>
              <Pressable
                onPress={() => togglePlan.mutate({ id: p.id, active: !p.active })}
                accessibilityRole="button"
                accessibilityLabel={p.active ? 'Planı pasifleştir' : 'Planı aktifleştir'}
                hitSlop={10}
                style={[styles.toggle, p.active ? styles.toggleActive : styles.toggleInactive]}
              >
                <Text style={p.active ? styles.toggleActiveText : styles.toggleInactiveText}>
                  {p.active ? 'Aktif' : 'Pasif'}
                </Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}

      <Text style={styles.section}>Egzersiz Seç</Text>
      {loadingEx ? (
        <ActivityIndicator />
      ) : (
        <View>
          {(exercises ?? []).map((ex) => {
            const active = exerciseId === ex.id;
            return (
              <Pressable
                key={ex.id}
                onPress={() => setExerciseId(ex.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${ex.name}, ${ex.durationMin} dakika`}
                style={[styles.exerciseItem, active && styles.exerciseItemActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>
                    {ex.name} {!ex.isSystem ? '(Özel)' : ''}
                  </Text>
                  <Text style={styles.exerciseDesc} numberOfLines={2}>
                    {ex.description}
                  </Text>
                  <Text style={styles.exerciseMeta}>{ex.durationMin} dk</Text>
                </View>
              </Pressable>
            );
          })}

          {!showCustom ? (
            <PrimaryButton
              variant="ghost"
              label="+ Yeni Egzersiz Tanımla"
              accessibilityHint="Katalogda olmayan özel bir egzersiz oluşturma formunu açar"
              onPress={() => setShowCustom(true)}
            />
          ) : (
            <Card accessibilityLabel="Yeni egzersiz oluşturma formu">
              <Text style={styles.sectionTitle}>Yeni Egzersiz</Text>
              <TextField
                label="Ad"
                value={customForm.name}
                onChangeText={(v) => setCustomForm((s) => ({ ...s, name: v }))}
              />
              <TextField
                label="Açıklama"
                value={customForm.description}
                onChangeText={(v) => setCustomForm((s) => ({ ...s, description: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TextField
                label="Süre (dk)"
                value={customForm.durationMin}
                onChangeText={(v) => setCustomForm((s) => ({ ...s, durationMin: v.replace(/[^0-9]/g, '') }))}
                keyboardType="numeric"
              />
              <PrimaryButton
                label="Egzersizi Kaydet"
                loading={createExercise.isPending}
                onPress={submitCustom}
              />
              <View style={{ height: spacing.sm }} />
              <PrimaryButton
                variant="ghost"
                label="Vazgeç"
                onPress={() => {
                  setShowCustom(false);
                  setError(null);
                }}
              />
            </Card>
          )}
        </View>
      )}

      <Text style={styles.section}>Saatler</Text>
      <View style={styles.timeRow} accessibilityRole="radiogroup">
        {PRESET_TIMES.map((t) => {
          const active = times.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() =>
                setTimes((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()
                )
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${t} saatini ${active ? 'kaldır' : 'ekle'}`}
              style={[styles.time, active && styles.timeActive]}
            >
              <Text style={[styles.timeText, active && styles.timeTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton label="Planı Kaydet" loading={createPlan.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  sectionTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  exerciseItem: {
    minHeight: TOUCH_MIN + 20,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  exerciseItemActive: { borderColor: colors.accent, backgroundColor: '#E0EAFE' },
  exerciseName: { ...typography.bodyBold, color: colors.textPrimary },
  exerciseDesc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  exerciseMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  time: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  timeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeText: { ...typography.body, color: colors.textPrimary },
  timeTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  planName: { ...typography.bodyBold, color: colors.textPrimary },
  planMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  toggle: {
    minHeight: TOUCH_MIN,
    minWidth: 70,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: colors.successBg },
  toggleInactive: { backgroundColor: colors.surfaceMuted },
  toggleActiveText: { color: colors.success, ...typography.bodyBold },
  toggleInactiveText: { color: colors.textMuted, ...typography.bodyBold },
});
