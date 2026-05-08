import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { caregiverApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CaregiverStackParamList } from '../../navigation/CaregiverStack';

type Nav = NativeStackNavigationProp<CaregiverStackParamList>;

const CATEGORY_LABELS: Record<string, string> = {
  MENTAL: 'Zihinsel / Nöro-gelişimsel',
  PHYSICAL: 'Bedensel / Ortopedik',
  SENSORY: 'Duyusal',
  CHRONIC: 'Kronik / Görünmez',
};

export function CaregiverProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['caregiver-profile'], queryFn: caregiverApi.profile });

  if (isLoading || !data) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  const lastMetric = data.metrics[0];
  const previousMetric = data.metrics[1];

  return (
    <Screen accessibilityLabel="Profil ekranı">
      <Heading title={data.fullName} subtitle="Hasta Takip Kullanıcısı" />

      <Card accessibilityLabel={`E-posta ${data.user.email}`}>
        <Text style={styles.k}>E-posta</Text>
        <Text style={styles.v}>{data.user.email}</Text>
      </Card>

      <Card
        accessibilityLabel={`Engel kategoriniz: ${
          data.disabilityCategory ? CATEGORY_LABELS[data.disabilityCategory] : 'henüz seçilmedi'
        }`}
      >
        <Text style={styles.k}>Engel Kategorisi</Text>
        <Text style={styles.v}>
          {data.disabilityCategory ? CATEGORY_LABELS[data.disabilityCategory] : 'Henüz seçilmedi'}
        </Text>
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          variant="secondary"
          label="Kategoriyi Değiştir"
          accessibilityHint="Engel kategorisini yeniden seçme ekranını açar"
          onPress={() => navigation.navigate('SelectDisabilityCategory')}
        />
      </Card>

      <Card accessibilityLabel="Atanmış hastalıklar">
        <Text style={styles.k}>Atanmış Hastalıklar</Text>
        {data.diseases.length === 0 ? (
          <Text style={styles.v}>Henüz atama yok</Text>
        ) : (
          <View style={styles.chipRow}>
            {data.diseases.map((d: any) => (
              <View key={d.id} style={styles.chip}>
                <Text style={styles.chipText}>{d.disease.name}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {data.diseases[0]?.doctor?.doctor ? (
        <Card>
          <Text style={styles.k}>Doktor</Text>
          <Text style={styles.v}>
            {data.diseases[0].doctor.doctor.title} {data.diseases[0].doctor.doctor.fullName}
            {' - '}
            {data.diseases[0].doctor.doctor.specialty}
          </Text>
        </Card>
      ) : null}

      <Card accessibilityLabel="Erişilebilirlik ayarları">
        <Text style={styles.k}>Erişilebilirlik</Text>
        <Text style={styles.v}>Yüksek kontrast, yazı boyutu, otomatik sesli okuma</Text>
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          variant="secondary"
          label="Erişilebilirlik Ayarları"
          accessibilityHint="Görme ve okuma tercihlerini düzenler"
          onPress={() => navigation.navigate('AccessibilitySettings')}
        />
      </Card>

      <Card accessibilityLabel="Acil durum bilgileri">
        <Text style={styles.k}>Acil Durum</Text>
        <Text style={styles.v}>
          Panik butonu basıldığında SMS gönderilecek kişiler ve tıbbi kart bilgileriniz
        </Text>
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          variant="secondary"
          label="Acil Durum Kontakları"
          accessibilityHint="Kontakları ekleme ve düzenleme ekranını açar"
          onPress={() => navigation.navigate('EmergencyContacts')}
        />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          variant="secondary"
          label="Tıbbi Kartım"
          accessibilityHint="Kan grubu, alerji ve kronik hastalık bilgilerini düzenler"
          onPress={() => navigation.navigate('MedicalCard')}
        />
      </Card>

      <Card>
        <Text style={styles.k}>Boy / Kilo</Text>
        {lastMetric ? (
          <Text style={styles.v}>
            {lastMetric.heightCm} cm / {lastMetric.weightKg} kg
            {previousMetric ? ` (önceki: ${previousMetric.heightCm}cm / ${previousMetric.weightKg}kg)` : ''}
          </Text>
        ) : (
          <Text style={styles.v}>Henüz ölçüm yok</Text>
        )}
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          variant="secondary"
          label="Yeni Ölçüm Gönder"
          accessibilityHint="Boy ve kilo güncelleme ekranını açar"
          onPress={() => navigation.navigate('EditMetrics')}
        />
      </Card>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton variant="danger" label="Çıkış Yap" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  k: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  v: { ...typography.body, color: colors.textSecondary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  chip: { backgroundColor: '#E0EAFE', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20 },
  chipText: { color: colors.accentDark, ...typography.bodyBold },
});
