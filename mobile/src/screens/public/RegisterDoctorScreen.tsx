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
import { ErrorBanner } from '../../components/ErrorBanner';
import { authApi } from '../../api/endpoints';
import { colors, radius, spacing, TOUCH_MIN } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/PublicStack';

type Props = NativeStackScreenProps<PublicStackParamList, 'RegisterDoctor'>;

export function RegisterDoctorScreen({ navigation }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    diplomaNumber: '',
    title: 'Uzman Doktor',
    specialty: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (Object.values(form).some((v) => !v)) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    if (form.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.registerDoctor(form);
      Alert.alert(
        'Kayıt alındı',
        'Hesabınız onay için iletildi. Owner onayından sonra hastalarınızı yönetebileceksiniz.',
        [{ text: 'Tamam', onPress: () => navigation.navigate('Login') }]
      );
    } catch (e: any) {
      setError(e?.message ?? 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} accessibilityLabel="Doktor kayıt ekranı">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={1.4}>
              Limitless Care
            </Text>
            <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.4}>
              Doktor{'\n'}Kayıt Ol
            </Text>
            <Text style={styles.subtitle} allowFontScaling maxFontSizeMultiplier={1.6}>
              Hesabınızı oluşturun ve hastalarınıza en iyi şekilde hizmet verin
            </Text>
          </View>

          <ErrorBanner message={error} />

          <TextField label="Ad Soyad" value={form.fullName} onChangeText={set('fullName')} hint="Tam adınız" />
          <TextField
            label="E-posta"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={set('email')}
            hint="İletişim e-postanız"
          />
          <TextField label="Şifre" password value={form.password} onChangeText={set('password')} hint="En az 8 karakter" />
          <TextField
            label="Doktor Kimliği"
            value={form.diplomaNumber}
            onChangeText={set('diplomaNumber')}
            hint="Tabip Odası diploma numaranız"
          />
          <TextField label="Unvan" value={form.title} onChangeText={set('title')} hint="Örn: Uzman Doktor, Profesör" />
          <TextField
            label="Uzmanlık Alanı"
            value={form.specialty}
            onChangeText={set('specialty')}
            hint="Örn: Kardiyoloji, Pediatri"
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
