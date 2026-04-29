import React, { useEffect, useRef } from 'react';
import { Text, View, AccessibilityInfo, findNodeHandle, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Ekran açılınca screen reader otomatik bu başlığa odaklansın. */
  autoFocus?: boolean;
};

export function Heading({ title, subtitle, autoFocus = true }: Props) {
  const ref = useRef<View>(null);
  useEffect(() => {
    if (!autoFocus) return;
    const handle = setTimeout(() => {
      const node = ref.current && findNodeHandle(ref.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 200);
    return () => clearTimeout(handle);
  }, [autoFocus]);

  return (
    <View ref={ref} accessibilityRole="header" accessible style={styles.wrap}>
      <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.6}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} allowFontScaling maxFontSizeMultiplier={1.6}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  title: { ...typography.display, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});
