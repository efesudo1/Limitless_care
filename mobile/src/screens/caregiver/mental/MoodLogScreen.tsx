import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { TextField } from '../../../components/TextField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { mentalApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

type Mood = 'HAPPY' | 'CALM' | 'ANXIOUS' | 'SAD' | 'ANGRY';

const MOODS: { key: Mood; label: string; emoji: string; color: string }[] = [
  { key: 'HAPPY', label: 'Mutlu', emoji: '😊', color: '#FCD34D' },
  { key: 'CALM', label: 'Sakin', emoji: '😌', color: '#A7F3D0' },
  { key: 'ANXIOUS', label: 'Endişeli', emoji: '😟', color: '#FCA5A5' },
  { key: 'SAD', label: 'Üzgün', emoji: '😢', color: '#93C5FD' },
  { key: 'ANGRY', label: 'Öfkeli', emoji: '😠', color: '#F87171' },
];

export function MoodLogScreen() {
  const qc = useQueryClient();
  const [mood, setMood] = useState<Mood | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['mood-logs'],
    queryFn: () => mentalApi.moodLogs(7),
  });

  const create = useMutation({
    mutationFn: mentalApi.createMood,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood-logs'] });
      setMood(null);
      setNote('');
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Eklenemedi'),
  });

  const submit = () => {
    if (!mood) {
      setError('Lütfen bir duygu seçin.');
      return;
    }
    create.mutate({ mood, intensity, note: note || undefined });
  };

  return (
    <Screen accessibilityLabel="Duygu durumu günlüğü ekranı">
      <Heading title="Duygu Durumu" subtitle="Bugünkü duygunuzu kaydedin. Doktor için trend oluşturulur." />
      <ErrorBanner message={error} />

      <Card>
        <Text style={styles.label}>Şu an nasıl hissediyorsunuz?</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {MOODS.map((m) => {
            const selected = mood === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMood(m.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={m.label}
                style={[styles.moodBtn, selected && { backgroundColor: m.color, borderColor: m.color }]}
              >
                <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
                  {m.emoji}
                </Text>
                <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.label}>Yoğunluk: {intensity} / 5</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((v) => (
            <Pressable
              key={v}
              onPress={() => setIntensity(v)}
              accessibilityRole="radio"
              accessibilityState={{ selected: intensity === v }}
              accessibilityLabel={`${v} yoğunluk`}
              style={[styles.intensity, intensity === v && styles.intensitySelected]}
            >
              <Text style={[styles.intensityText, intensity === v && styles.intensityTextSelected]}>{v}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <TextField
          label="Not (opsiyonel)"
          value={note}
          onChangeText={setNote}
          hint="Bu durumun bağlamını yazabilirsiniz"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      <PrimaryButton label="Kaydet" loading={create.isPending} onPress={submit} />

      <Heading title="Son 7 Gün" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>Henüz kayıt yok.</Text>
        </Card>
      ) : (
        data!.slice(0, 10).map((log: any) => {
          const m = MOODS.find((x) => x.key === log.mood);
          return (
            <Card
              key={log.id}
              accessibilityLabel={`${m?.label}, yoğunluk ${log.intensity}, ${new Date(log.loggedAt).toLocaleString(
                'tr-TR'
              )}`}
            >
              <Text style={styles.logRow}>
                {m?.emoji} {m?.label} · Yoğunluk {log.intensity}
              </Text>
              <Text style={styles.logTime}>{new Date(log.loggedAt).toLocaleString('tr-TR')}</Text>
              {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  moodBtn: {
    minWidth: 80,
    minHeight: 80,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 32, marginBottom: spacing.xs },
  moodLabel: { ...typography.caption, color: colors.textPrimary },
  moodLabelSelected: { fontWeight: '700' },
  intensity: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensitySelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  intensityText: { ...typography.bodyBold, color: colors.textPrimary },
  intensityTextSelected: { color: colors.textOnPrimary },
  logRow: { ...typography.bodyBold, color: colors.textPrimary },
  logTime: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  logNote: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});
