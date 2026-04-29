import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { doctorApi } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthContext';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Nav = NativeStackNavigationProp<DoctorStackParamList>;

export function DoctorHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['doctor-patients'], queryFn: doctorApi.patients });

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  const totalPatients = data?.length ?? 0;
  const pendingActivation = (data ?? []).filter((p: any) => p.diseases.some((d: any) => d.status === 'PENDING_USER')).length;

  return (
    <Screen accessibilityLabel="Doktor ana ekranı">
      <Heading title={`Hoş Geldiniz, Dr. ${user?.doctor?.fullName?.split(' ')[0] ?? ''}`} subtitle="Bugünkü hastalarınızın genel durumu" />

      <View style={styles.statRow}>
        <View style={[styles.stat, { backgroundColor: '#E0F4F3' }]} accessibilityLabel={`Toplam hasta ${totalPatients}`}>
          <Text style={styles.statLabel}>Toplam Hasta</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>{totalPatients}</Text>
        </View>
        <View style={[styles.stat, { backgroundColor: '#FFE9C2' }]} accessibilityLabel={`Onay bekleyen atama ${pendingActivation}`}>
          <Text style={styles.statLabel}>Bekleyen</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>{pendingActivation}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => navigation.navigate('AssignDisease', {})}
        accessibilityRole="button"
        accessibilityLabel="Yeni hasta atama ekranını aç"
        style={styles.cta}
      >
        <Text style={styles.ctaText}>+ Yeni Hastalık Atama</Text>
      </Pressable>

      <Text style={styles.section} accessibilityRole="header">Hastalar</Text>
      {(data ?? []).slice(0, 5).map((p: any, idx: number) => (
        <Card key={`${p.caregiverEmail}-${idx}`}>
          <Text style={styles.pName} allowFontScaling maxFontSizeMultiplier={1.6}>{p.fullName ?? p.caregiverEmail}</Text>
          <Text style={styles.pMeta}>
            {p.diseases.map((d: any) => d.name).join(' · ')}
          </Text>
          <Text style={styles.pMeta}>
            {p.caregiverEmail}
          </Text>
        </Card>
      ))}

      <Pressable
        onPress={() => navigation.navigate('Patients')}
        accessibilityRole="button"
        accessibilityLabel="Tüm hastaları gör"
        style={styles.linkRow}
      >
        <Text style={styles.linkText}>Tümünü Gör →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stat: { flex: 1, padding: spacing.lg, borderRadius: radius.md },
  statLabel: { ...typography.body, color: colors.textPrimary },
  statValue: { ...typography.display, marginTop: spacing.xs },
  cta: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    minHeight: TOUCH_MIN + 8,
    justifyContent: 'center',
  },
  ctaText: { color: colors.textOnPrimary, ...typography.bodyBold },
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  pName: { ...typography.bodyBold, color: colors.textPrimary },
  pMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  linkRow: { alignItems: 'flex-end', paddingVertical: spacing.md },
  linkText: { ...typography.bodyBold, color: colors.accent },
});
