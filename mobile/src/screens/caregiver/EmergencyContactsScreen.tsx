import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Card } from '../../components/Card';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorBanner } from '../../components/ErrorBanner';
import { emergencyApi } from '../../api/endpoints';
import { DEFAULT_EMERGENCY_MESSAGE } from '../../emergency/panic';
import { colors, radius, spacing, typography } from '../../theme';

type Contact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
};

const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;

export function EmergencyContactsScreen() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Contact[]>({
    queryKey: ['emergency-contacts'],
    queryFn: emergencyApi.contacts,
  });
  const { data: medicalCard } = useQuery<{ emergencyMessage: string | null }>({
    queryKey: ['medical-card'],
    queryFn: emergencyApi.getMedicalCard,
  });

  const [form, setForm] = useState({ name: '', phone: '', relation: '', priority: '1' });
  const [emergencyMessage, setEmergencyMessage] = useState<string>(DEFAULT_EMERGENCY_MESSAGE);
  const [messageSaved, setMessageSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (medicalCard?.emergencyMessage != null) {
      setEmergencyMessage(medicalCard.emergencyMessage);
    }
  }, [medicalCard?.emergencyMessage]);

  const updateMessage = useMutation({
    mutationFn: (msg: string) => emergencyApi.updateMedicalCard({ emergencyMessage: msg }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['medical-card'] });
      setMessageSaved(true);
      setTimeout(() => setMessageSaved(false), 2000);
    },
    onError: (e: any) => setError(e?.message ?? 'Mesaj kaydedilemedi'),
  });

  const create = useMutation({
    mutationFn: emergencyApi.createContact,
    onSuccess: () => {
      setForm({ name: '', phone: '', relation: '', priority: '1' });
      setError(null);
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
    },
    onError: (e: any) => setError(e?.message ?? 'Kontak eklenemedi'),
  });

  const remove = useMutation({
    mutationFn: emergencyApi.deleteContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency-contacts'] }),
  });

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.relation.trim()) {
      setError('Ad, telefon ve yakınlık alanları zorunludur.');
      return;
    }
    if (!PHONE_REGEX.test(form.phone.trim())) {
      setError('Telefon numarası geçersiz. (Örn: +905551234567 veya 0555 123 45 67)');
      return;
    }
    const priority = Number(form.priority) || 1;
    create.mutate({
      name: form.name.trim(),
      phone: form.phone.trim(),
      relation: form.relation.trim(),
      priority,
    });
  };

  const confirmDelete = (c: Contact) => {
    Alert.alert(
      'Kontağı sil',
      `${c.name} kişisini acil kontaklarınızdan kaldırmak istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => remove.mutate(c.id) },
      ]
    );
  };

  return (
    <Screen accessibilityLabel="Acil durum kontakları ekranı">
      <Heading
        title="Acil Durum Kontakları"
        subtitle="Panik butonuna basıldığında en düşük öncelik numarasına sahip kişi otomatik olarak aranır. Sonraki 2 kişiye SMS hazırlanır. Telefon numarasını doğru girdiğinizden emin olun."
      />
      <ErrorBanner message={error} />

      <Card accessibilityLabel="Acil durum SMS mesaj şablonu">
        <Text style={styles.cardTitle}>Acil Durum Mesajım</Text>
        <Text style={styles.helperText}>
          Bu metin SMS gönderildiğinde mesajın başına yazılır. Sonuna anlık konum eklenir.
        </Text>
        <TextField
          label="Mesaj"
          value={emergencyMessage}
          onChangeText={(v) => setEmergencyMessage(v)}
          hint="Yakınlarınıza iletilecek metin"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={500}
        />
        {messageSaved ? (
          <Text style={styles.savedText} accessibilityLiveRegion="polite">
            Mesaj kaydedildi.
          </Text>
        ) : null}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <PrimaryButton
              variant="ghost"
              label="Varsayılana Dön"
              accessibilityHint="Mesajı varsayılan metne sıfırlar"
              onPress={() => setEmergencyMessage(DEFAULT_EMERGENCY_MESSAGE)}
            />
          </View>
          <View style={{ width: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <PrimaryButton
              label="Kaydet"
              loading={updateMessage.isPending}
              onPress={() => updateMessage.mutate(emergencyMessage.trim() || DEFAULT_EMERGENCY_MESSAGE)}
            />
          </View>
        </View>
      </Card>

      <Card accessibilityLabel="Yeni kontak ekleme formu">
        <Text style={styles.cardTitle}>Yeni Kontak Ekle</Text>
        <TextField
          label="Ad Soyad"
          value={form.name}
          onChangeText={(v) => setForm((s) => ({ ...s, name: v }))}
          hint="Acil durumda aranacak kişi"
        />
        <TextField
          label="Telefon"
          value={form.phone}
          onChangeText={(v) => setForm((s) => ({ ...s, phone: v }))}
          keyboardType="phone-pad"
          hint="Ülke kodu önerilir, örn +90"
        />
        <TextField
          label="Yakınlık"
          value={form.relation}
          onChangeText={(v) => setForm((s) => ({ ...s, relation: v }))}
          hint="Anne, baba, eş, doktor gibi"
        />
        <TextField
          label="Öncelik (1 en yüksek)"
          value={form.priority}
          onChangeText={(v) => setForm((s) => ({ ...s, priority: v.replace(/[^0-9]/g, '') }))}
          keyboardType="numeric"
          hint="1 ile 99 arasında"
        />
        <PrimaryButton label="Kontak Ekle" onPress={submit} loading={create.isPending} />
      </Card>

      <Heading title="Kayıtlı Kontaklar" autoFocus={false} />
      {isLoading ? (
        <ActivityIndicator />
      ) : (data?.length ?? 0) === 0 ? (
        <Card>
          <Text style={styles.empty}>Henüz kontak yok. Önce yukarıdan ekleyin.</Text>
        </Card>
      ) : (
        data!.map((c) => (
          <Card
            key={c.id}
            accessibilityLabel={`${c.name}, ${c.relation}, telefon ${c.phone}, öncelik ${c.priority}`}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.detail}>
                  {c.relation} · {c.phone}
                </Text>
                <Text style={styles.priority}>Öncelik {c.priority}</Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(c)}
                accessibilityRole="button"
                accessibilityLabel={`${c.name} kontağını sil`}
                hitSlop={12}
                style={styles.removeBtn}
              >
                <Text style={styles.removeText}>Sil</Text>
              </Pressable>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.md },
  helperText: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  savedText: { color: colors.success, ...typography.bodyBold, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  name: { ...typography.bodyBold, color: colors.textPrimary },
  detail: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  priority: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  removeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: { color: colors.danger, ...typography.bodyBold },
});
