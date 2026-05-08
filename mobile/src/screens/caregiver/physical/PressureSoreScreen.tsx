import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { TextField } from '../../../components/TextField';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { physicalApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

type Position = 'LEFT_SIDE' | 'RIGHT_SIDE' | 'SUPINE' | 'PRONE' | 'SITTING';
const POSITIONS: { key: Position; label: string; icon: string }[] = [
  { key: 'LEFT_SIDE', label: 'Sol yan', icon: '⬅️' },
  { key: 'RIGHT_SIDE', label: 'Sağ yan', icon: '➡️' },
  { key: 'SUPINE', label: 'Sırt üstü', icon: '⬆️' },
  { key: 'PRONE', label: 'Yüz üstü', icon: '⬇️' },
  { key: 'SITTING', label: 'Oturur', icon: '🪑' },
];

export function PressureSoreScreen() {
  const qc = useQueryClient();
  const [position, setPosition] = useState<Position | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['pressure-checks'],
    queryFn: () => physicalApi.pressureChecks(7),
  });

  const create = useMutation({
    mutationFn: () => physicalApi.createPressureCheck({ position: position!, note: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pressure-checks'] });
      setPosition(null);
      setNote('');
      setError(null);
    },
    onError: (e: any) => setError(e?.message ?? 'Kaydedilemedi'),
  });

  const submit = () => {
    if (!position) {
      setError('Yeni pozisyonu seçin.');
      return;
    }
    create.mutate();
  };

  const lastCheck = data?.[0];
  const minutesSinceLast = lastCheck
    ? Math.floor((Date.now() - new Date(lastCheck.checkedAt).getTime()) / 60000)
    : null;

  return (
    <Screen accessibilityLabel="Bası yarası kontrol ekranı">
      <Heading
        title="Pozisyon Değiştirme"
        subtitle="Bası yarası riskini önlemek için her 2 saatte bir pozisyon değiştirildiğini kaydedin."
      />
      <ErrorBanner message={error} />

      {minutesSinceLast != null ? (
        <Card
          accessibilityLabel={`Son pozisyon değişiminden ${minutesSinceLast} dakika geçti`}
          style={{ backgroundColor: minutesSinceLast > 120 ? colors.warningBg : colors.successBg }}
        >
          <Text style={styles.lastTitle}>Son değişim</Text>
          <Text style={styles.lastText}>
            {POSITIONS.find((p) => p.key === lastCheck.position)?.label} · {minutesSinceLast} dk önce
            {minutesSinceLast > 120 ? ' (önerilen sınır geçti)' : ''}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.label}>Yeni Pozisyon</Text>
        <View style={styles.row} accessibilityRole="radiogroup">
          {POSITIONS.map((p) => {
            const active = position === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPosition(p.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={p.label}
                style={[styles.posBtn, active && styles.posBtnActive]}
              >
                <Text style={styles.posIcon} accessibilityElementsHidden importantForAccessibility="no">
                  {p.icon}
                </Text>
                <Text style={[styles.posText, active && styles.posTextActive]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <TextField
          label="Not (opsiyonel)"
          value={note}
          onChangeText={setNote}
          hint="Cilt durumu, kızarıklık vs."
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </Card>

      <PrimaryButton label="Pozisyonu Kaydet" loading={create.isPending} onPress={submit} />

      <Heading title="Son 7 Gün" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>Henüz kayıt yok.</Text>
        </Card>
      ) : (
        data!.slice(0, 20).map((c: any) => (
          <Card
            key={c.id}
            accessibilityLabel={`${POSITIONS.find((p) => p.key === c.position)?.label}, ${new Date(
              c.checkedAt
            ).toLocaleString('tr-TR')}`}
          >
            <Text style={styles.logRow}>
              {POSITIONS.find((p) => p.key === c.position)?.label}
            </Text>
            <Text style={styles.logTime}>{new Date(c.checkedAt).toLocaleString('tr-TR')}</Text>
            {c.note ? <Text style={styles.logNote}>{c.note}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  posBtn: {
    minWidth: 90,
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBtnActive: { backgroundColor: '#E0EAFE', borderColor: colors.accent },
  posIcon: { fontSize: 22, marginBottom: spacing.xs },
  posText: { ...typography.caption, color: colors.textPrimary },
  posTextActive: { color: colors.accent, fontWeight: '600' },
  lastTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  lastText: { ...typography.body, color: colors.textPrimary },
  logRow: { ...typography.bodyBold, color: colors.textPrimary },
  logTime: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  logNote: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});
