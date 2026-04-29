import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, Pressable } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../theme';

type Props = TextInputProps & {
  label: string;
  /** Erişilebilirlik için doğal-dil ipucu. */
  hint?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  password?: boolean;
};

export function TextField({ label, hint, errorMessage, leftIcon, password, style, ...rest }: Props) {
  const [secure, setSecure] = useState(!!password);
  const inputId = rest.accessibilityLabel ?? label;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label} accessibilityRole="text" allowFontScaling maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
      <View style={[styles.field, !!errorMessage && styles.fieldError]}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          accessible
          accessibilityLabel={inputId}
          accessibilityHint={hint}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password ? secure : rest.secureTextEntry}
          style={[styles.input, style]}
          allowFontScaling
          maxFontSizeMultiplier={1.6}
        />
        {password ? (
          <Pressable
            onPress={() => setSecure((s) => !s)}
            accessibilityRole="button"
            accessibilityLabel={secure ? 'Şifreyi göster' : 'Şifreyi gizle'}
            hitSlop={12}
            style={styles.eye}
          >
            <Text style={styles.eyeText}>{secure ? 'Göster' : 'Gizle'}</Text>
          </Pressable>
        ) : null}
      </View>
      {errorMessage ? (
        <Text
          style={styles.error}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  field: {
    minHeight: TOUCH_MIN + 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    ...typography.body,
  },
  eye: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  eyeText: { color: colors.primary, ...typography.bodyBold },
  error: { color: colors.danger, marginTop: spacing.xs, ...typography.caption },
});
