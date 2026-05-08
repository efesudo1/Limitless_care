import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { TextField } from '../../../components/TextField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { mentalApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

export function RoutineScreen() {
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['routines'],
    queryFn: mentalApi.routines,
  });

  const create = useMutation({
    mutationFn: () => mentalApi.createRoutine({ label: label.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routines'] });
      setLabel('');
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Eklenemedi'),
  });

  const complete = useMutation({
    mutationFn: (id: string) => mentalApi.completeRoutine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => mentalApi.deleteRoutine(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });

  const submit = () => {
    if (!label.trim()) {
      setError('Rutin adı gerekli.');
      return;
    }
    create.mutate();
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <Screen accessibilityLabel="Günlük rutin ekranı">
      <Heading title="Günlük Rutin" subtitle="Tekrar eden rutinleri ekleyin ve tamamlandığını işaretleyin." />
      <ErrorBanner message={error} />

      <Card>
        <TextField
          label="Yeni Rutin"
          value={label}
          onChangeText={setLabel}
          hint="Örn: Sabah dişlerimi fırçala, dua, yürüyüş"
        />
        <PrimaryButton label="Ekle" loading={create.isPending} onPress={submit} />
      </Card>

      <Heading title="Rutinlerim" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>Henüz rutin yok.</Text>
        </Card>
      ) : (
        data!.map((r: any) => {
          const completedToday = (r.completions ?? []).some(
            (c: any) => new Date(c.completedAt) >= todayStart
          );
          return (
            <Card
              key={r.id}
              accessibilityLabel={`${r.label}, bugün ${completedToday ? 'tamamlandı' : 'tamamlanmadı'}`}
            >
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{r.label}</Text>
                  <Text style={styles.meta}>
                    Son 30 gün: {(r.completions ?? []).length} kez tamamlandı
                  </Text>
                </View>
                <Pressable
                  onPress={() => !completedToday && complete.mutate(r.id)}
                  disabled={completedToday}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: completedToday, disabled: completedToday }}
                  accessibilityLabel={completedToday ? 'Bugün tamamlandı' : 'Tamamlandı olarak işaretle'}
                  style={[styles.tick, completedToday && styles.tickOn]}
                >
                  <Text style={styles.tickText}>{completedToday ? '✓' : '○'}</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert('Rutini sil', `${r.label} silinsin mi?`, [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => remove.mutate(r.id) },
                    ])
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${r.label} rutinini sil`}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>Sil</Text>
                </Pressable>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  tick: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.success, borderColor: colors.success },
  tickText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  removeBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: colors.danger, ...typography.bodyBold },
});
