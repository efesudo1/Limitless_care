import React, { useState } from 'react';
import { Alert, View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { authApi } from '../../api/endpoints';
import { colors, radius, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/PublicStack';

type Props = NativeStackScreenProps<PublicStackParamList, 'RegisterCaregiver'>;

const GENDERS: { key: 'MALE' | 'FEMALE' | 'OTHER'; label: string }[] = [
  { key: 'FEMALE', label: 'Kadın' },
  { key: 'MALE', label: 'Erkek' },
  { key: 'OTHER', label: 'Diğer' },
];

export function RegisterCaregiverScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    gender: 'FEMALE' as 'MALE' | 'FEMALE' | 'OTHER',
    birthDate: '',
    heightCm: '',
    weightKg: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: any) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    const heightNum = Number(form.heightCm);
    const weightNum = Number(form.weightKg);
    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.birthDate ||
      !heightNum ||
      !weightNum
    ) {
      setError('Tüm alanlar zorunludur (boy ve kilo dahil).');
      return;
    }
    if (form.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
      setError('Doğum tarihini YYYY-AA-GG biçiminde girin (ör. 1990-05-12).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.registerCaregiver({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        gender: form.gender,
        birthDate: form.birthDate,
        heightCm: heightNum,
        weightKg: weightNum,
      });
      Alert.alert('Kayıt başarılı', 'Şimdi giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      setError(e?.message ?? 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen accessibilityLabel="Hasta takip kayıt ekranı">
      <Heading title="Hasta Takip Kayıt Ol" />
      <ErrorBanner message={error} />
      <TextField label="Ad Soyad" value={form.fullName} onChangeText={set('fullName')} hint="Hasta tam adı" />
      <TextField
        label="E-posta"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={set('email')}
        hint="Doktorunuzun atama yapacağı adres"
      />
      <TextField label="Şifre" password value={form.password} onChangeText={set('password')} hint="En az 8 karakter" />

      <Text style={styles.label} accessibilityRole="text">Cinsiyet</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {GENDERS.map((g) => {
          const selected = form.gender === g.key;
          return (
            <Pressable
              key={g.key}
              onPress={() => set('gender')(g.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={g.label}
              style={[styles.chip, selected && styles.chipSelected]}
              hitSlop={8}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{g.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <DateField
        label="Doğum Tarihi"
        value={form.birthDate}
        onChange={set('birthDate')}
        hint="Tıbbi takip için yaş hesabında kullanılır"
        maximumDate={new Date()}
      />
      <TextField
        label="Boy (cm)"
        value={form.heightCm}
        onChangeText={set('heightCm')}
        hint="Santimetre cinsinden"
        keyboardType="numeric"
      />
      <TextField
        label="Kilo (kg)"
        value={form.weightKg}
        onChangeText={set('weightKg')}
        hint="Kilogram cinsinden"
        keyboardType="numeric"
      />
      <PrimaryButton label="Kayıt Ol" loading={loading} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.body, color: colors.textPrimary },
  chipTextSelected: { color: colors.textOnPrimary, fontWeight: '600' },
});
