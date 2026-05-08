import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { authApi } from '../../api/endpoints';
import { colors, radius, spacing, TOUCH_MIN } from '../../theme';
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
    <SafeAreaView style={styles.safe} accessibilityLabel="Hasta takip kayıt ekranı">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={1.4}>
              Limitless Care
            </Text>
            <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.4}>
              Hasta Takip{'\n'}Kayıt Ol
            </Text>
            <Text style={styles.subtitle} allowFontScaling maxFontSizeMultiplier={1.6}>
              Sağlığınızı takip etmek için hesap oluşturun
            </Text>
          </View>

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

          <Text style={styles.fieldLabel} accessibilityRole="text">Cinsiyet</Text>
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

          <Pressable
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Kayıt Ol"
            accessibilityState={{ disabled: loading, busy: loading }}
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed, loading && styles.disabled]}
          >
            <Text style={styles.btnPrimaryText} allowFontScaling maxFontSizeMultiplier={1.4}>
              {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
            accessibilityLabel="Zaten hesabım var, giriş yap"
            hitSlop={12}
            style={styles.backLink}
          >
            <Text style={styles.backText} allowFontScaling maxFontSizeMultiplier={1.6}>
              Zaten hesabınız var mı? <Text style={styles.backTextStrong}>Giriş Yap</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  header: { marginBottom: spacing.xl },
  brand: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  title: { fontSize: 36, fontWeight: '800', lineHeight: 42, color: colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: spacing.sm },
  fieldLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  chipTextSelected: { color: colors.textOnPrimary, fontWeight: '700' },
  btnPrimary: {
    minHeight: TOUCH_MIN + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: { color: colors.textOnPrimary, fontSize: 17, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  backLink: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm },
  backText: { fontSize: 15, color: colors.textSecondary },
  backTextStrong: { color: colors.primary, fontWeight: '700' },
});
