import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { authApi } from '../../api/endpoints';
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
    <Screen accessibilityLabel="Doktor kayıt ekranı">
      <Heading title="Doktor Kayıt Ol" subtitle="Hesabınızı oluşturun ve hastalarınıza en iyi şekilde hizmet verin." />
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
      <TextField
        label="Şifre"
        password
        value={form.password}
        onChangeText={set('password')}
        hint="En az 8 karakter"
      />
      <TextField
        label="Doktor Kimliği"
        value={form.diplomaNumber}
        onChangeText={set('diplomaNumber')}
        hint="Tabip Odası diploma numaranız"
      />
      <TextField
        label="Unvan"
        value={form.title}
        onChangeText={set('title')}
        hint="Örn: Uzman Doktor, Profesör"
      />
      <TextField
        label="Uzmanlık Alanı"
        value={form.specialty}
        onChangeText={set('specialty')}
        hint="Örn: Kardiyoloji, Pediatri"
      />
      <PrimaryButton label="Kayıt Ol" loading={loading} onPress={submit} />
    </Screen>
  );
}
