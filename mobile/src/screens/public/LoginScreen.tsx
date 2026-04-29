import React, { useState } from 'react';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../auth/AuthContext';

export function LoginScreen() {
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
    <Screen accessibilityLabel="Giriş ekranı">
      <Heading title="Giriş Yap" subtitle="Hesabınıza erişmek için bilgilerinizi girin" />
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
      <PrimaryButton
        label="Giriş Yap"
        accessibilityHint="Girilen bilgilerle oturum açar"
        loading={loading}
        onPress={submit}
      />
    </Screen>
  );
}
