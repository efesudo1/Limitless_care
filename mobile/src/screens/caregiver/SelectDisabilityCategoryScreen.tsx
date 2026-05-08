import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { ErrorBanner } from '../../components/ErrorBanner';
import { caregiverApi } from '../../api/endpoints';
import { API_BASE_URL } from '../../api/client';
import { useAuth, DisabilityCategory } from '../../auth/AuthContext';
import { useAccessibility } from '../../theme/AccessibilityContext';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';

type CategoryOption = {
  key: DisabilityCategory;
  label: string;
  description: string;
  icon: string;
  examples: string;
};

const CATEGORIES: CategoryOption[] = [
  {
    key: 'MENTAL',
    label: 'Zihinsel / Nöro-gelişimsel',
    description: 'Otizm, Alzheimer, Down sendromu, dikkat eksikliği',
    icon: '🧠',
    examples: 'Rutin takibi ve duygu durumu günlüğü',
  },
  {
    key: 'PHYSICAL',
    label: 'Bedensel / Ortopedik',
    description: 'Serebral palsi, omurilik felci, protez kullanıcıları',
    icon: '🦽',
    examples: 'Fizik tedavi egzersizleri ve bası yarası kontrolü',
  },
  {
    key: 'SENSORY',
    label: 'Duyusal',
    description: 'Görme veya işitme bozuklukları',
    icon: '👁️',
    examples: 'Yüksek kontrast tema ve ekran okuyucu',
  },
  {
    key: 'CHRONIC',
    label: 'Kronik / Görünmez',
    description: 'Diyabet, MS, epilepsi',
    icon: '💊',
    examples: 'Nöbet kayıt defteri ve atak sıklığı analizi',
  },
];

export function SelectDisabilityCategoryScreen() {
  const { refreshProfile } = useAuth();
  const { setPrefs } = useAccessibility();
  const [selected, setSelected] = useState<DisabilityCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!selected) {
      setError('Lütfen bir kategori seçin.');
      AccessibilityInfo.announceForAccessibility('Lütfen bir kategori seçin');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setError(`(test) İstek atılıyor: ${API_BASE_URL}/me/profile`);
      await caregiverApi.updateProfile({ disabilityCategory: selected });
      setError(null);
      if (selected === 'SENSORY') {
        await setPrefs({ highContrast: true, autoSpeakOnScreenEnter: true, fontScale: 1.3 });
      }
      await refreshProfile();
    } catch (e: any) {
      const status = e?.response?.status;
      const responseData = e?.response?.data;
      const code = e?.code;
      const detail = `[${code ?? '?'}] ${status ?? '?'} ${
        typeof responseData === 'object' ? JSON.stringify(responseData) : String(responseData ?? '')
      } | URL=${API_BASE_URL}/me/profile | msg=${e?.message ?? 'unknown'}`;
      setError(detail);
      setLoading(false);
    }
  };

  return (
    <Screen accessibilityLabel="Engel kategorisi seçim ekranı">
      <Heading
        title="Sizi Tanıyalım"
        subtitle="Uygulamayı ihtiyacınıza göre özelleştirmek için bir kategori seçin. Daha sonra değiştirebilirsiniz."
      />
      <ErrorBanner message={error} />
      <View style={styles.list}>
        {CATEGORIES.map((c) => {
          const isSelected = selected === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => setSelected(c.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              accessibilityLabel={`${c.label}. ${c.description}. Bu kategori ${c.examples} sunar.`}
              accessibilityHint="Çift dokunarak seçin"
              hitSlop={8}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
                {c.icon}
              </Text>
              <View style={styles.cardBody}>
                <Text style={[styles.label, isSelected && styles.labelSelected]} allowFontScaling maxFontSizeMultiplier={1.6}>
                  {c.label}
                </Text>
                <Text style={[styles.desc, isSelected && styles.descSelected]} allowFontScaling maxFontSizeMultiplier={1.6}>
                  {c.description}
                </Text>
                <Text style={[styles.examples, isSelected && styles.examplesSelected]} allowFontScaling maxFontSizeMultiplier={1.6}>
                  {c.examples}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.lg }} />
      <Pressable
        onPress={submit}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Devam Et"
        accessibilityHint="Seçtiğiniz kategoriyi kaydeder"
        accessibilityState={{ disabled: loading, busy: loading }}
        style={({ pressed }) => [
          styles.continue,
          loading && styles.continueDisabled,
          pressed && styles.continuePressed,
        ]}
      >
        <Text style={styles.continueLabel} allowFontScaling maxFontSizeMultiplier={1.6}>
          {loading ? 'Kaydediliyor…' : 'Devam Et'}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.lg,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: '#E6F4F4' },
  cardPressed: { opacity: 0.85 },
  cardBody: { flex: 1 },
  icon: { fontSize: 40 },
  label: { ...typography.h2, color: colors.textPrimary },
  labelSelected: { color: colors.primaryDark },
  desc: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  descSelected: { color: colors.textPrimary },
  examples: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
  examplesSelected: { color: colors.primaryDark },
  continue: {
    minHeight: TOUCH_MIN + 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueDisabled: { opacity: 0.5 },
  continuePressed: { opacity: 0.85 },
  continueLabel: { ...typography.bodyBold, color: colors.textOnPrimary, fontSize: 18 },
});
