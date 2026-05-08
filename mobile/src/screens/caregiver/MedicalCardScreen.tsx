import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { emergencyApi } from '../../api/endpoints';
import { colors, spacing, typography } from '../../theme';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-'];

type MedicalCard = {
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  medicalNotes: string | null;
};

export function MedicalCardScreen() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<MedicalCard>({
    queryKey: ['medical-card'],
    queryFn: emergencyApi.getMedicalCard,
  });

  const [form, setForm] = useState<MedicalCard>({
    bloodType: null,
    allergies: null,
    chronicConditions: null,
    medicalNotes: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const update = useMutation({
    mutationFn: emergencyApi.updateMedicalCard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-card'] });
      setSaved(true);
      setError(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: any) => {
      setError(e?.message ?? 'Kayıt başarısız');
      setSaved(false);
    },
  });

  const submit = () => {
    update.mutate({
      bloodType: form.bloodType?.trim() || null,
      allergies: form.allergies?.trim() || null,
      chronicConditions: form.chronicConditions?.trim() || null,
      medicalNotes: form.medicalNotes?.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen accessibilityLabel="Tıbbi kart ekranı">
      <Heading
        title="Tıbbi Kartım"
        subtitle="Acil durumda doktor ve ilk yardım için kritik bilgilerinizi tutun. Bu bilgiler doktorunuzla paylaşılır."
      />
      <ErrorBanner message={error} />
      {saved ? (
        <Card accessibilityLabel="Kayıt başarılı">
          <Text style={styles.savedText} accessibilityLiveRegion="polite">
            Tıbbi kartınız güncellendi.
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.label}>Kan Grubu</Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel="Kan grubu seçimi">
          {BLOOD_TYPES.map((bt) => {
            const selected = form.bloodType === bt;
            return (
              <Text
                key={bt}
                onPress={() => setForm((s) => ({ ...s, bloodType: bt }))}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Kan grubu ${bt}`}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                {bt}
              </Text>
            );
          })}
        </View>
      </Card>

      <Card>
        <TextField
          label="Alerjiler"
          value={form.allergies ?? ''}
          onChangeText={(v) => setForm((s) => ({ ...s, allergies: v }))}
          hint="Penisilin, fıstık gibi bilinen alerjileri yazın"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      <Card>
        <TextField
          label="Kronik Hastalıklar"
          value={form.chronicConditions ?? ''}
          onChangeText={(v) => setForm((s) => ({ ...s, chronicConditions: v }))}
          hint="Diyabet, hipertansiyon gibi sürekli takip edilen durumlar"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </Card>

      <Card>
        <TextField
          label="Ek Notlar"
          value={form.medicalNotes ?? ''}
          onChangeText={(v) => setForm((s) => ({ ...s, medicalNotes: v }))}
          hint="İlk yardım ekibi için önemli olabilecek ek bilgiler"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>

      <PrimaryButton label="Kaydet" loading={update.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    ...typography.bodyBold,
  },
  chipSelected: { backgroundColor: colors.primary, color: colors.textOnPrimary, borderColor: colors.primary },
  savedText: { color: colors.success, ...typography.bodyBold },
});
