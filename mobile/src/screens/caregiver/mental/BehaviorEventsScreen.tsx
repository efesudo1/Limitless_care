import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { TextField } from '../../../components/TextField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { mentalApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

type BType = 'TANTRUM' | 'REPETITIVE' | 'AGGRESSION' | 'WITHDRAWAL' | 'OTHER';
const TYPES: { key: BType; label: string }[] = [
  { key: 'TANTRUM', label: 'Öfke nöbeti' },
  { key: 'REPETITIVE', label: 'Tekrarlayıcı' },
  { key: 'AGGRESSION', label: 'Saldırganlık' },
  { key: 'WITHDRAWAL', label: 'İçe kapanma' },
  { key: 'OTHER', label: 'Diğer' },
];

export function BehaviorEventsScreen() {
  const qc = useQueryClient();
  const [type, setType] = useState<BType>('TANTRUM');
  const [duration, setDuration] = useState('');
  const [trigger, setTrigger] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['behavior-events'],
    queryFn: () => mentalApi.behaviorEvents(30),
  });

  const create = useMutation({
    mutationFn: () =>
      mentalApi.createBehaviorEvent({
        type,
        durationMin: duration ? Number(duration) : undefined,
        trigger: trigger || undefined,
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['behavior-events'] });
      setDuration('');
      setTrigger('');
      setNote('');
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Eklenemedi'),
  });

  return (
    <Screen accessibilityLabel="Davranış olayları ekranı">
      <Heading
        title="Davranış Olayları"
        subtitle="Öfke nöbeti, tekrarlayıcı davranış gibi olayları kaydedin. Tetikleyici analizinde kullanılır."
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
          label="Süre (dk, opsiyonel)"
          value={duration}
          onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          hint="Olay kaç dakika sürdü?"
        />
        <TextField
          label="Tetikleyici (opsiyonel)"
          value={trigger}
          onChangeText={setTrigger}
          hint="Örn: yüksek ses, kalabalık, açlık"
        />
        <TextField
          label="Not (opsiyonel)"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      <PrimaryButton label="Olayı Kaydet" loading={create.isPending} onPress={() => create.mutate()} />

      <Heading title="Son 30 Gün" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>Olay yok.</Text>
        </Card>
      ) : (
        data!.slice(0, 20).map((ev: any) => (
          <Card
            key={ev.id}
            accessibilityLabel={`${TYPES.find((t) => t.key === ev.type)?.label ?? ev.type}, ${new Date(
              ev.occurredAt
            ).toLocaleString('tr-TR')}`}
          >
            <Text style={styles.evTitle}>
              {TYPES.find((t) => t.key === ev.type)?.label ?? ev.type}
              {ev.durationMin ? ` · ${ev.durationMin} dk` : ''}
            </Text>
            <Text style={styles.evMeta}>{new Date(ev.occurredAt).toLocaleString('tr-TR')}</Text>
            {ev.trigger ? <Text style={styles.evNote}>Tetikleyici: {ev.trigger}</Text> : null}
            {ev.note ? <Text style={styles.evNote}>{ev.note}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
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
