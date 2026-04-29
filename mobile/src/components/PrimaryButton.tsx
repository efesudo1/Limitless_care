import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, View } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  /** Erişilebilirlik için ek bilgi: "Hesabınızı oluşturup hastalarınıza erişeceksiniz" gibi. */
  accessibilityHint?: string;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
};

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  accessibilityHint,
  style,
  leftIcon,
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : colors.textOnPrimary} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text
            style={[styles.label, styles[`${variant}Label` as const]]}
            allowFontScaling
            maxFontSizeMultiplier={1.6}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: TOUCH_MIN + 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primary: { backgroundColor: colors.primary },
  primaryLabel: { color: colors.textOnPrimary, ...typography.bodyBold },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  secondaryLabel: { color: colors.primary, ...typography.bodyBold },
  danger: { backgroundColor: colors.danger },
  dangerLabel: { color: colors.textOnPrimary, ...typography.bodyBold },
  ghost: { backgroundColor: 'transparent' },
  ghostLabel: { color: colors.primary, ...typography.bodyBold },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: {},
});
