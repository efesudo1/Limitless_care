import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { useAccessibility } from '../../theme/AccessibilityContext';
import { colors, radius, spacing, typography } from '../../theme';

const SCALES: Array<{ value: 1 | 1.3 | 1.6; label: string }> = [
  { value: 1, label: 'Standart' },
  { value: 1.3, label: 'Büyük' },
  { value: 1.6, label: 'Çok büyük' },
];

export function AccessibilitySettingsScreen() {
  const { prefs, setPrefs } = useAccessibility();

  return (
    <Screen accessibilityLabel="Erişilebilirlik ayarları ekranı">
      <Heading
        title="Erişilebilirlik"
        subtitle="Görme, okuma ve sesli özellikler için tercihlerinizi düzenleyin."
      />

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.k}>Yüksek Kontrast</Text>
            <Text style={styles.v}>Görme zorluğu için siyah/sarı temayı tercih ediyorsanız açın.</Text>
          </View>
          <Switch
            value={prefs.highContrast}
            onValueChange={(v) => setPrefs({ highContrast: v })}
            accessibilityLabel="Yüksek kontrast modu"
            accessibilityState={{ checked: prefs.highContrast }}
          />
        </View>
      </Card>

      <Card>
        <Text style={styles.k}>Yazı Boyutu</Text>
        <View style={styles.scaleRow} accessibilityRole="radiogroup" accessibilityLabel="Yazı boyutu seçimi">
          {SCALES.map((s) => {
            const active = prefs.fontScale === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => setPrefs({ fontScale: s.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${s.label}, ${Math.round(s.value * 100)}%`}
                style={[styles.scaleBtn, active && styles.scaleBtnActive]}
              >
                <Text style={[styles.scaleText, { fontSize: 14 * s.value }, active && styles.scaleTextActive]}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.k}>Ekran Açılınca Otomatik Oku</Text>
            <Text style={styles.v}>
              Bugün ekranı vb. açıldığında günün özetini otomatik sesli okur.
            </Text>
          </View>
          <Switch
            value={prefs.autoSpeakOnScreenEnter}
            onValueChange={(v) => setPrefs({ autoSpeakOnScreenEnter: v })}
            accessibilityLabel="Otomatik sesli okuma"
            accessibilityState={{ checked: prefs.autoSpeakOnScreenEnter }}
          />
        </View>
      </Card>

      <Card accessibilityLabel="Ek bilgiler">
        <Text style={styles.k}>İpucu</Text>
        <Text style={styles.v}>
          VoiceOver (iOS) veya TalkBack (Android) açıkken uygulama tüm butonları sesli okur. Bu ayarlar
          sistem ayarlarınızdan bağımsız çalışır.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  k: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  v: { ...typography.body, color: colors.textSecondary },
  scaleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  scaleBtn: {
    flex: 1,
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  scaleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  scaleText: { ...typography.body, color: colors.textPrimary },
  scaleTextActive: { color: colors.textOnPrimary, fontWeight: '700' },
});
