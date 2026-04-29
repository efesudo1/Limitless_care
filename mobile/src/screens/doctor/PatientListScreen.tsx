import React, { useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { Card } from '../../components/Card';
import { doctorApi } from '../../api/endpoints';
import { colors, spacing, typography } from '../../theme';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Nav = NativeStackNavigationProp<DoctorStackParamList>;

export function PatientListScreen() {
  const navigation = useNavigation<Nav>();
  const { data, isLoading } = useQuery({ queryKey: ['doctor-patients'], queryFn: doctorApi.patients });
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!q) return data;
    const term = q.toLowerCase();
    return data.filter(
      (p: any) =>
        p.caregiverEmail.toLowerCase().includes(term) ||
        (p.fullName ?? '').toLowerCase().includes(term) ||
        p.diseases.some((d: any) => d.name.toLowerCase().includes(term))
    );
  }, [data, q]);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} accessibilityLabel="Hasta listesi ekranı" contentStyle={{ padding: spacing.lg }}>
      <Heading title="Hastalar" />
      <TextField
        label="Ara"
        hint="Hasta adı, e-posta veya hastalıkla arama"
        placeholder="Ara..."
        value={q}
        onChangeText={setQ}
      />
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.fullName ?? item.caregiverEmail} hasta detayını aç`}
            onPress={() =>
              navigation.navigate('PatientDetail', {
                patientDiseaseId: item.diseases[0].id,
              })
            }
          >
            <Card>
              <Text style={styles.name}>{item.fullName ?? item.caregiverEmail}</Text>
              <Text style={styles.meta}>{item.caregiverEmail}</Text>
              <View style={styles.tagRow}>
                {item.diseases.slice(0, 3).map((d: any) => (
                  <View key={d.id} style={styles.tag}>
                    <Text style={styles.tagText}>{d.name}</Text>
                  </View>
                ))}
                {item.diseases.length > 3 ? (
                  <Text style={styles.meta}>+{item.diseases.length - 3}</Text>
                ) : null}
              </View>
              {item.latestMetric ? (
                <Text style={styles.meta}>
                  Son ölçüm: {item.latestMetric.heightCm} cm / {item.latestMetric.weightKg} kg
                </Text>
              ) : null}
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <Card>
            <Text>Henüz atanmış hasta yok.</Text>
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { ...typography.bodyBold, color: colors.textPrimary },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  tag: { backgroundColor: '#E0EAFE', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 12 },
  tagText: { color: colors.accentDark, ...typography.caption },
});
