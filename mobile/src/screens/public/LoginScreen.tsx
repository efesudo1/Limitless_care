import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../../components/TextField';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../auth/AuthContext';
import { colors, radius, spacing, TOUCH_MIN } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/PublicStack';

type Props = NativeStackScreenProps<PublicStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setError('E-posta ve şifre zorunludur.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e?.message ?? 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} accessibilityLabel="Giriş ekranı">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.brand} accessibilityRole="header" allowFontScaling maxFontSizeMultiplier={1.4}>
              Limitless Care
            </Text>
            <Text style={styles.title} allowFontScaling maxFontSizeMultiplier={1.4}>
              Tekrar{'\n'}Hoş Geldiniz
            </Text>
            <Text style={styles.subtitle} allowFontScaling maxFontSizeMultiplier={1.6}>
              Hesabınıza erişmek için giriş yapın
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorBanner message={error} />
            <TextField
              label="E-posta"
              hint="Kayıt olduğunuz e-posta adresi"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
            />
            <TextField
              label="Şifre"
              hint="Hesap şifreniz"
              password
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            <Pressable
              onPress={submit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Giriş Yap"
              accessibilityHint="Girilen bilgilerle oturum açar"
              accessibilityState={{ disabled: loading, busy: loading }}
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              <Text style={styles.btnPrimaryText} allowFontScaling maxFontSizeMultiplier={1.4}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('Welcome')}
              accessibilityRole="link"
              accessibilityLabel="Hesabım yok, kayıt ekranına dön"
              hitSlop={12}
              style={styles.backLink}
            >
              <Text style={styles.backText} allowFontScaling maxFontSizeMultiplier={1.6}>
                Hesabınız yok mu? <Text style={styles.backTextStrong}>Kayıt Ol</Text>
              </Text>
            </Pressable>
          </View>
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
    paddingTop: spacing.xl,
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
  title: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  form: { flex: 1 },
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
