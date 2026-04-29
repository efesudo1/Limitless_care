import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type SymptomEntry = {
  symptomId: string;
  symptomName: string;
  mild: number;
  moderate: number;
  severe: number;
};

type Props = {
  data: SymptomEntry[];
  /** Erişilebilirlik için alt başlık. */
  caption?: string;
};

const sev = {
  mild: { color: '#FFD43B', label: 'Hafif' },
  moderate: { color: '#FF8A3D', label: 'Orta' },
  severe: { color: '#E14E4E', label: 'Ağır' },
} as const;

/**
 * Görsel olmayan kullanıcılar için her semptom için sayısal değerler de
 * accessibilityLabel içinde sözel olarak verilir.
 */
export function SeverityChart({ data, caption }: Props) {
  const filtered = data.filter((d) => d.mild + d.moderate + d.severe > 0);
  if (filtered.length === 0) {
    return (
      <View style={styles.empty} accessibilityLabel="Bu dönemde semptom kaydı yok">
        <Text style={styles.emptyText}>Bu dönemde kaydedilmiş semptom yok.</Text>
      </View>
    );
  }

  const max = Math.max(...filtered.map((d) => d.mild + d.moderate + d.severe));

  return (
    <View accessibilityLabel={caption ?? 'Semptom şiddet dağılımı'}>
      {filtered.map((d) => {
        const total = d.mild + d.moderate + d.severe;
        const widthPct = (n: number) => (n / max) * 100;
        const summary = `${d.symptomName}: hafif ${d.mild}, orta ${d.moderate}, ağır ${d.severe}, toplam ${total}.`;
        return (
          <View key={d.symptomId} style={styles.row} accessibilityLabel={summary} accessible>
            <Text style={styles.name} numberOfLines={2}>{d.symptomName}</Text>
            <View style={styles.bar}>
              <View style={[styles.segment, { width: `${widthPct(d.mild)}%`, backgroundColor: sev.mild.color }]} />
              <View style={[styles.segment, { width: `${widthPct(d.moderate)}%`, backgroundColor: sev.moderate.color }]} />
              <View style={[styles.segment, { width: `${widthPct(d.severe)}%`, backgroundColor: sev.severe.color }]} />
              <Text style={styles.total}>{total}</Text>
            </View>
          </View>
        );
      })}
      <View style={styles.legend} accessibilityElementsHidden importantForAccessibility="no">
        {(['mild', 'moderate', 'severe'] as const).map((k) => (
          <View key={k} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: sev[k].color }]} />
            <Text style={styles.legendText}>{sev[k].label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  name: { ...typography.caption, color: colors.textPrimary, marginBottom: 2 },
  bar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    alignItems: 'center',
  },
  segment: { height: '100%' },
  total: { position: 'absolute', right: 8, color: colors.textPrimary, ...typography.caption, fontWeight: '600' },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendText: { ...typography.caption, color: colors.textSecondary },
  empty: { padding: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
