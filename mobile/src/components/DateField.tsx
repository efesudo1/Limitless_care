import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../theme';

// @react-native-community/datetimepicker lazy-loaded (kurulu değilse fallback'e düşer)
let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch {
  /* not installed yet */
}

type Props = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  hint?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function DateField({ label, value, onChange, hint, minimumDate, maximumDate }: Props) {
  const [open, setOpen] = useState(false);
  const dateValue = value ? new Date(value) : new Date();

  // datetimepicker kurulu değilse normal text field gibi davranır
  if (!DateTimePicker) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.field}>
          <Text style={styles.value}>{value || 'YYYY-AA-GG'}</Text>
        </View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  }

  const onChangeNative = (event: any, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event?.type === 'dismissed') return;
    if (selected) onChange(fmt(selected));
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} accessibilityRole="text">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || 'Seçilmedi'}`}
        accessibilityHint={hint ?? 'Tarih seçici aç'}
        hitSlop={6}
        style={styles.field}
      >
        <Text style={[styles.value, !value && styles.valuePlaceholder]} allowFontScaling maxFontSizeMultiplier={1.6}>
          {value ? new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Tarih seçin'}
        </Text>
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {open ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeNative}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          locale="tr-TR"
        />
      ) : null}
      {open && Platform.OS === 'ios' ? (
        <Pressable
          onPress={() => setOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Tarih seçimini kapat"
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>Tamam</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  field: {
    minHeight: TOUCH_MIN + 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  value: { ...typography.body, color: colors.textPrimary },
  valuePlaceholder: { color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  closeBtn: { alignSelf: 'flex-end', padding: spacing.sm },
  closeText: { ...typography.bodyBold, color: colors.primary },
});
