import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { TextField } from '../../components/TextField';
import { DateField } from '../../components/DateField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { catalogApi, doctorApi } from '../../api/endpoints';
import { colors, radius, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { DoctorStackParamList } from '../../navigation/DoctorStack';

type Props = NativeStackScreenProps<DoctorStackParamList, 'PrescriptionForm'>;

const PRESET_TIMES = ['08:00', '12:00', '14:00', '18:00', '20:00', '22:00'];

export function PrescriptionFormScreen({ route, navigation }: Props) {
  const qc = useQueryClient();
  const { patientDiseaseId } = route.params;
  const [medicationId, setMedicationId] = useState<string | null>(null);
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState('mg');
  const [times, setTimes] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const { data: meds, isLoading } = useQuery({ queryKey: ['medications'], queryFn: catalogApi.medications });

  const create = useMutation({
    mutationFn: () =>
      doctorApi.createPrescription({
        patientDiseaseId,
        medicationId,
        doseAmount: Number(doseAmount),
        doseUnit,
        scheduleTimes: times,
        instructions: instructions || undefined,
        startsOn,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeline', patientDiseaseId] });
      Alert.alert('Reçete eklendi', 'İlaç hasta uygulamasında günlük görev olarak görünecek.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (e: any) => setError(e?.message ?? 'Eklenemedi.'),
  });

  const submit = () => {
    if (!medicationId || !doseAmount || times.length === 0) {
      setError('İlaç, doz ve en az bir saat zorunlu.');
      return;
    }
    create.mutate();
  };

  return (
    <Screen accessibilityLabel="Reçete formu ekranı">
      <Heading title="Yeni Reçete" subtitle="İlaç ve günlük saat programı" />
      <ErrorBanner message={error} />

      <Text style={styles.section}>İlaç</Text>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={meds ?? []}
          keyExtractor={(m: any) => m.id}
          horizontal={false}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const active = medicationId === item.id;
            return (
              <Pressable
                onPress={() => {
                  setMedicationId(item.id);
                  setDoseUnit(item.defaultUnit);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${item.name} (${item.defaultUnit})`}
                style={[styles.item, active && styles.itemActive]}
              >
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.defaultUnit}</Text>
              </Pressable>
            );
          }}
        />
      )}

      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <TextField label="Doz" value={doseAmount} onChangeText={setDoseAmount} keyboardType="numeric" hint="Sayı" />
        </View>
        <View style={{ width: spacing.md }} />
        <View style={{ flex: 1 }}>
          <TextField label="Birim" value={doseUnit} onChangeText={setDoseUnit} hint="mg, ml, IU" />
        </View>
      </View>

      <Text style={styles.section}>Saatler</Text>
      <View style={styles.timeRow} accessibilityRole="radiogroup">
        {PRESET_TIMES.map((t) => {
          const active = times.includes(t);
          return (
            <Pressable
              key={t}
              onPress={() =>
                setTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()))
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${t} saatini ${active ? 'kaldır' : 'ekle'}`}
              style={[styles.time, active && styles.timeActive]}
            >
              <Text style={[styles.timeText, active && styles.timeTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>

      <DateField
        label="Başlangıç Tarihi"
        value={startsOn}
        onChange={setStartsOn}
        hint="İlk doz hangi günden başlasın?"
      />
      <TextField
        label="Talimat (opsiyonel)"
        value={instructions}
        onChangeText={setInstructions}
        hint="Yemekten önce, aç karnına gibi"
      />

      <PrimaryButton label="Reçeteyi Kaydet" loading={create.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginVertical: spacing.sm },
  row: { flexDirection: 'row' },
  item: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  itemActive: { borderColor: colors.accent, backgroundColor: '#E0EAFE' },
  itemName: { ...typography.bodyBold, color: colors.textPrimary },
  itemMeta: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  time: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  timeActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  timeText: { ...typography.body, color: colors.textPrimary },
  timeTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
});
