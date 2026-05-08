import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { physicalApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

export function ExercisePlanScreen() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['exercise-plans'],
    queryFn: physicalApi.exercisePlans,
  });

  const complete = useMutation({
    mutationFn: (planId: string) => physicalApi.completeExercise(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercise-plans'] }),
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return (
    <Screen accessibilityLabel="Fizik tedavi egzersizleri ekranı">
      <Heading
        title="Egzersizlerim"
        subtitle="Doktorunuzun atadığı egzersiz programını uygulayıp tamamlandığını işaretleyin."
      />

      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={typography.body}>
            Henüz size atanmış egzersiz yok. Doktorunuz bir program oluşturduğunda burada görünecek.
          </Text>
        </Card>
      ) : (
        data!.map((plan: any) => {
          const completedToday = (plan.completions ?? []).some(
            (c: any) => new Date(c.completedAt) >= todayStart
          );
          return (
            <Card
              key={plan.id}
              accessibilityLabel={`${plan.exercise.name}, süre ${plan.exercise.durationMin} dakika, bugün ${
                completedToday ? 'tamamlandı' : 'tamamlanmadı'
              }`}
            >
              <Text style={styles.title}>{plan.exercise.name}</Text>
              <Text style={styles.meta}>
                {plan.exercise.durationMin} dk
                {plan.scheduleTimes?.length ? ` · ${plan.scheduleTimes.join(', ')}` : ''}
              </Text>
              {plan.exercise.description ? (
                <Text style={styles.desc}>{plan.exercise.description}</Text>
              ) : null}
              {plan.exercise.videoUrl ? (
                <Pressable
                  onPress={() => Linking.openURL(plan.exercise.videoUrl)}
                  accessibilityRole="link"
                  accessibilityLabel="Egzersiz videosunu aç"
                  style={styles.videoBtn}
                >
                  <Text style={styles.videoText}>📺 Videoyu Aç</Text>
                </Pressable>
              ) : null}
              <View style={{ height: spacing.sm }} />
              <Pressable
                onPress={() => !completedToday && complete.mutate(plan.id)}
                disabled={completedToday}
                accessibilityRole="button"
                accessibilityState={{ disabled: completedToday }}
                accessibilityLabel={completedToday ? 'Bugün tamamlandı' : 'Tamamlandı olarak işaretle'}
                style={[styles.completeBtn, completedToday && styles.completeBtnDone]}
              >
                <Text style={styles.completeText}>
                  {completedToday ? '✓ Bugün tamamlandı' : 'Tamamladım'}
                </Text>
              </Pressable>
              <Text style={styles.history}>
                Son 30 gün: {(plan.completions ?? []).length} kez yapıldı
              </Text>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  desc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  videoBtn: { marginTop: spacing.sm },
  videoText: { color: colors.accent, ...typography.bodyBold },
  completeBtn: {
    minHeight: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  completeBtnDone: { backgroundColor: colors.success },
  completeText: { color: colors.textOnPrimary, ...typography.bodyBold },
  history: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
});
