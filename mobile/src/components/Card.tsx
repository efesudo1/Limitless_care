import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function Card({ children, style, accessibilityLabel }: { children: React.ReactNode; style?: ViewStyle; accessibilityLabel?: string }) {
  return (
    <View
      style={[styles.card, style]}
      accessibilityLabel={accessibilityLabel}
      accessible={!!accessibilityLabel}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
