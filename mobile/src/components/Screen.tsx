import React from 'react';
import { ScrollView, View, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  background?: string;
  contentStyle?: ViewStyle;
  /** Ekrana açıldığında screen reader'ın okuyacağı genel başlık. */
  accessibilityLabel?: string;
};

export function Screen({ children, scroll = true, padded = true, background, contentStyle, accessibilityLabel }: Props) {
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: background ?? colors.background }]}
      accessibilityLabel={accessibilityLabel}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Container
          style={styles.flex}
          contentContainerStyle={[padded && styles.padded, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
});
