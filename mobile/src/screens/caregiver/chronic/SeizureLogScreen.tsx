import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { TextField } from '../../../components/TextField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { chronicApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

type SType = 'TONIC_CLONIC' | 'ABSENCE' | 'MYOCLONIC' | 'FOCAL' | 'OTHER';
const TYPES: { key: SType; label: string }[] = [
  { key: 'TONIC_CLONIC', label: 'Tonik-klonik' },
  { key: 'ABSENCE', label: 'Absans' },
  { key: 'MYOCLONIC', label: 'Myoklonik' },
  { key: 'FOCAL', label: 'Fokal' },
  { key: 'OTHER', label: 'Diğer' },
];
const SEVERITIES: { key: 'MILD' | 'MODERATE' | 'SEVERE'; label: string }[] = [
  { key: 'MILD', label: 'Hafif' },
  { key: 'MODERATE', label: 'Orta' },
  { key: 'SEVERE', label: 'Şiddetli' },
];

export function SeizureLogScreen() {
  const qc = useQueryClient();
  const [type, setType] = useState<SType>('TONIC_CLONIC');
  const [duration, setDuration] = useState('');
  const [trigger, setTrigger] = useState('');
  const [post, setPost] = useState('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['seizures'],
    queryFn: () => chronicApi.seizures(30),
  });

  const create = useMutation({
    mutationFn: () =>
      chronicApi.createSeizure({
        type,
        durationSeconds: Number(duration),
        trigger: trigger || undefined,
        postIctalNotes: post || undefined,
        severity: severity ?? undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seizures'] });
      qc.invalidateQueries({ queryKey: ['seizure-stats'] });
      setDuration('');
      setTrigger('');
      setPost('');
      setSeverity(null);
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Kaydedilemedi'),
  });

  const submit = () => {
    const n = Number(duration);
    if (!n || n <= 0) {
      setError('Süre saniyesi gerekli (örn: 45).');
      return;
    }
    create.mutate();
  };

  return (
    <Screen accessibilityLabel="Nöbet kayıt ekranı">
      <Heading
        title="Nöbet Kaydı"
        subtitle="Nöbet bilgilerini kaydedin. Doktor tetikleyici ve sıklık analizi için kullanır."
      />
      <ErrorBanner message={error} />

      <Card>
        <Text style={styles.label}>Tip</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {TYPES.map((t) => {
            const active = type === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setType(t.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <TextField
          label="Süre (saniye)"
          value={duration}
          onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          hint="Nöbet kaç saniye sürdü?"
        />
        <Text style={styles.label}>Şiddet</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {SEVERITIES.map((s) => {
            const active = severity === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSeverity(s.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={s.label}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: spacing.md }} />
        <TextField
          label="Tetikleyici (opsiyonel)"
          value={trigger}
          onChangeText={setTrigger}
          hint="Örn: uykusuzluk, ışık, stres"
        />
        <TextField
          label="Nöbet Sonrası Notlar"
          value={post}
          onChangeText={setPost}
          hint="Bilinç durumu, yorgunluk, vb."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      <PrimaryButton label="Nöbeti Kaydet" loading={create.isPending} onPress={submit} />

      <Heading title="Son 30 Gün" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>Bu dönemde nöbet kaydı yok.</Text>
        </Card>
      ) : (
        data!.slice(0, 20).map((s: any) => (
          <Card
            key={s.id}
            accessibilityLabel={`${TYPES.find((t) => t.key === s.type)?.label}, ${s.durationSeconds} saniye, ${new Date(
              s.occurredAt
            ).toLocaleString('tr-TR')}`}
          >
            <Text style={styles.evTitle}>
              {TYPES.find((t) => t.key === s.type)?.label} · {s.durationSeconds} sn
              {s.severity ? ` · ${SEVERITIES.find((x) => x.key === s.severity)?.label}` : ''}
            </Text>
            <Text style={styles.evMeta}>{new Date(s.occurredAt).toLocaleString('tr-TR')}</Text>
            {s.trigger ? <Text style={styles.evNote}>Tetikleyici: {s.trigger}</Text> : null}
            {s.postIctalNotes ? <Text style={styles.evNote}>{s.postIctalNotes}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { ...typography.body, color: colors.textPrimary },
  chipTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  evTitle: { ...typography.bodyBold, color: colors.textPrimary },
  evMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  evNote: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});
