import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../../components/Screen';
import { Heading } from '../../../components/Heading';
import { Card } from '../../../components/Card';
import { chronicApi } from '../../../api/endpoints';
import { colors, radius, spacing, typography } from '../../../theme';

export function SeizureStatsScreen() {
  const [days, setDays] = useState<7 | 30>(30);
  const { data, isLoading } = useQuery({
    queryKey: ['seizure-stats', days],
    queryFn: () => chronicApi.seizureStats(days),
  });

  if (isLoading || !data) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  const dayEntries = Object.entries(data.byDayOfWeek as Record<string, number>);
  const hourEntries = Object.entries(data.byHour as Record<string, number>);
  const maxDay = Math.max(1, ...dayEntries.map(([, v]) => v));
  const maxHour = Math.max(1, ...hourEntries.map(([, v]) => v));

  const peakDay = dayEntries.reduce((a, b) => (b[1] > a[1] ? b : a), dayEntries[0]);

  return (
    <Screen accessibilityLabel="Nöbet istatistikleri ekranı">
      <Heading
        title="Nöbet İstatistikleri"
        subtitle={`Son ${days} gün — toplam ${data.total} nöbet`}
      />

      <View style={styles.tabRow}>
        {([7, 30] as const).map((d) => {
          const active = days === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDays(d)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Son ${d} gün`}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>Son {d} gün</Text>
            </Pressable>
          );
        })}
      </View>

      {data.total === 0 ? (
        <Card>
          <Text style={typography.body}>Bu dönemde nöbet kaydı yok.</Text>
        </Card>
      ) : (
        <>
          <Card accessibilityLabel={`Pik gün: ${peakDay[0]}, ${peakDay[1]} nöbet`}>
            <Text style={styles.k}>İçgörü</Text>
            <Text style={styles.v}>
              En sık {peakDay[0]} günleri kaydedildi ({peakDay[1]} nöbet).
            </Text>
          </Card>

          <Card accessibilityLabel="Haftanın günlerine göre nöbet dağılımı">
            <Text style={styles.k}>Haftanın Günleri</Text>
            {dayEntries.map(([day, count]) => (
              <View key={day} style={styles.barRow}>
                <Text style={styles.barLabel}>{day}</Text>
                <View style={styles.barBg}>
                  <View
                    style={[styles.barFill, { width: `${(count / maxDay) * 100}%` }]}
                    accessibilityLabel={`${day}: ${count} nöbet`}
                  />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </Card>

          <Card accessibilityLabel="Saatlere göre nöbet dağılımı">
            <Text style={styles.k}>Saat Dağılımı</Text>
            <View style={styles.hourGrid}>
              {hourEntries.map(([hour, count]) => (
                <View key={hour} style={styles.hourCell}>
                  <View style={[styles.hourFill, { height: `${(count / maxHour) * 100}%` }]} />
                  <Text style={styles.hourLabel}>{hour}</Text>
                </View>
              ))}
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { ...typography.bodyBold, color: colors.textPrimary },
  tabTextActive: { color: colors.textOnPrimary },
  k: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  v: { ...typography.body, color: colors.textSecondary },
  barRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xs, gap: spacing.sm },
  barLabel: { width: 84, ...typography.body, color: colors.textPrimary },
  barBg: { flex: 1, height: 14, backgroundColor: colors.border, borderRadius: 7, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent },
  barCount: { width: 28, textAlign: 'right', ...typography.bodyBold, color: colors.textPrimary },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: spacing.sm,
    height: 80,
    alignItems: 'flex-end',
  },
  hourCell: { width: 12, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  hourFill: { width: '100%', backgroundColor: colors.accent, minHeight: 1 },
  hourLabel: { fontSize: 8, color: colors.textMuted, marginTop: 2 },
});
