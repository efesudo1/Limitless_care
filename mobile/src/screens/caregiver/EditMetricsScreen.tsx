import React, { useState } from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { caregiverApi } from '../../api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CaregiverStackParamList } from '../../navigation/CaregiverStack';

type Props = NativeStackScreenProps<CaregiverStackParamList, 'EditMetrics'>;

export function EditMetricsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w) {
      setError('Boy ve kilo zorunlu, geçerli sayılar girin.');
      return;
    }
    setLoading(true);
    try {
      await caregiverApi.updateMetrics(h, w);
      qc.invalidateQueries({ queryKey: ['caregiver-profile'] });
      Alert.alert('Kaydedildi', 'Yeni ölçüm profilinize eklendi.', [{ text: 'Tamam', onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      setError(e?.message ?? 'Kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen accessibilityLabel="Boy ve kilo güncelleme ekranı">
      <Heading title="Yeni Ölçüm" subtitle="Boy ve kilonuzdaki değişimi gönderin" />
      <ErrorBanner message={error} />
      <TextField label="Boy (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" hint="Santimetre cinsinden" />
      <TextField label="Kilo (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" hint="Kilogram cinsinden" />
      <PrimaryButton label="Kaydet" loading={loading} onPress={submit} />
    </Screen>
  );
}
