import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { doctorApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { colors, spacing, typography } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Nav = NativeStackNavigationProp<DoctorStackParamList>;

export function DoctorProfileScreen() {
  const { logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useQuery({ queryKey: ['doctor-me'], queryFn: doctorApi.me });

  if (isLoading || !data) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen accessibilityLabel="Doktor profili">
      <Heading title={`Dr. ${data.fullName}`} subtitle={data.specialty} />
      <Card>
        <Text style={styles.k}>E-posta</Text>
        <Text style={styles.v}>{data.user.email}</Text>
      </Card>
      <Card>
        <Text style={styles.k}>Doktor Kimliği</Text>
        <Text style={styles.v}>{data.diplomaNumber}</Text>
      </Card>
      <Card>
        <Text style={styles.k}>Unvan</Text>
        <Text style={styles.v}>{data.title}</Text>
      </Card>
      <Card>
        <Text style={styles.k}>Uzmanlık Alanı</Text>
        <Text style={styles.v}>{data.specialty}</Text>
      </Card>
      <Card>
        <Text style={styles.k}>Hesap Durumu</Text>
        <Text style={styles.v}>{data.status}</Text>
      </Card>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton
        variant="secondary"
        label="Hastalık & Semptom Yönetimi"
        accessibilityHint="Sisteme yeni hastalık veya semptom ekleyebileceğiniz ekranı açar"
        onPress={() => navigation.navigate('CatalogManage')}
      />
      <View style={{ height: spacing.md }} />
      <PrimaryButton variant="danger" label="Çıkış Yap" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  k: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  v: { ...typography.body, color: colors.textSecondary },
});
