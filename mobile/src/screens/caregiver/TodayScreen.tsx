import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Heading } from '../../components/Heading';
import { caregiverApi } from '../../api/endpoints';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CaregiverStackParamList } from '../../navigation/CaregiverStack';
import { syncMedicationReminders } from '../../notifications/scheduler';
import { PanicButton } from '../../components/PanicButton';
import { AlertBanner } from '../../components/AlertBanner';
import { speak } from '../../voice';
import {
  donateLogSymptomShortcut,
  donateMedicationTakenShortcut,
  donatePanicShortcut,
} from '../../siri/shortcuts';
import { useAccessibility } from '../../theme/AccessibilityContext';

type Nav = NativeStackNavigationProp<CaregiverStackParamList>;

type DoseEvent = {
  id: string;
  scheduledAt: string;
  takenAt: string | null;
  status: 'PENDING' | 'TAKEN_ON_TIME' | 'TAKEN_LATE' | 'MISSED';
};

type FoodReq = 'ANY' | 'BEFORE_MEAL' | 'AFTER_MEAL' | 'WITH_MEAL';
const FOOD_LABELS: Record<FoodReq, string> = {
  ANY: '',
  BEFORE_MEAL: 'Yemekten önce',
  AFTER_MEAL: 'Yemekten sonra',
  WITH_MEAL: 'Yemekle',
};

type ShortcutDef = {
  route: keyof CaregiverStackParamList;
  label: string;
  icon: string;
  hint: string;
};

const CATEGORY_SHORTCUTS: Record<string, ShortcutDef[]> = {
  MENTAL: [
    { route: 'MoodLog', label: 'Duygu Durumu', icon: '😊', hint: 'Bugünkü duygunuzu kaydet' },
    { route: 'Routine', label: 'Rutinler', icon: '📋', hint: 'Günlük rutinlerinizi takip edin' },
    { route: 'BehaviorEvents', label: 'Davranış', icon: '🌀', hint: 'Davranış olayı kaydet' },
  ],
  PHYSICAL: [
    { route: 'ExercisePlan', label: 'Egzersizler', icon: '🏋️', hint: 'Bugünkü egzersizleri görüntüle' },
    { route: 'PressureSore', label: 'Pozisyon', icon: '🛏️', hint: 'Pozisyon değiştirme kaydı' },
  ],
  CHRONIC: [
    { route: 'SeizureLog', label: 'Nöbet Kaydı', icon: '⚡', hint: 'Yeni nöbet bilgisi gir' },
    { route: 'SeizureStats', label: 'İstatistik', icon: '📊', hint: 'Nöbet sıklığını ve dağılımı gör' },
  ],
  SENSORY: [
    {
      route: 'AccessibilitySettings',
      label: 'Erişilebilirlik',
      icon: '🔆',
      hint: 'Yüksek kontrast, yazı boyutu ve sesli okuma ayarları',
    },
  ],
};

function CategoryShortcuts({
  category,
  navigation,
}: {
  category: 'MENTAL' | 'PHYSICAL' | 'SENSORY' | 'CHRONIC' | null;
  navigation: Nav;
}) {
  if (!category) return null;
  const shortcuts = CATEGORY_SHORTCUTS[category] ?? [];
  if (!shortcuts.length) return null;
  return (
    <View>
      <Text
        style={{
          ...typography.h2,
          color: colors.textPrimary,
          marginTop: spacing.lg,
          marginBottom: spacing.sm,
        }}
        accessibilityRole="header"
      >
        Kategoriye Özel
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {shortcuts.map((s) => (
          <Pressable
            key={s.route as string}
            onPress={() => navigation.navigate(s.route as never)}
            accessibilityRole="button"
            accessibilityLabel={s.label}
            accessibilityHint={s.hint}
            style={{
              flexBasis: '48%',
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: TOUCH_MIN + 30,
              alignItems: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 28 }} accessibilityElementsHidden importantForAccessibility="no">
              {s.icon}
            </Text>
            <Text style={{ ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.xs }}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type LowStockItem = {
  prescriptionId: string;
  medicationName: string;
  remaining: number;
  daysRemaining: number | null;
};

export function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { prefs } = useAccessibility();
  const qc = useQueryClient();
  const announcedRef = React.useRef(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['today'],
    queryFn: caregiverApi.today,
  });

  const checkDose = useMutation({
    mutationFn: ({ id }: { id: string }) => caregiverApi.checkDose(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  });

  const refillMutation = useMutation({
    mutationFn: ({ id, addedCount }: { id: string; addedCount: number }) =>
      caregiverApi.refillStock(id, addedCount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['today'] }),
  });

  const [refillFor, setRefillFor] = useState<LowStockItem | null>(null);
  const [refillAmount, setRefillAmount] = useState('');

  // İlaç hatırlatma bildirimlerini senkronla + Siri donations
  React.useEffect(() => {
    if (!data) return;
    const prescriptions = data.flatMap((d: any) =>
      d.prescriptions.map((p: any) => ({
        id: p.id,
        medicationName: p.medication.name,
        doseAmount: p.doseAmount,
        doseUnit: p.doseUnit,
        scheduleTimes: p.scheduleTimes as string[],
      }))
    );
    syncMedicationReminders(prescriptions).catch(() => undefined);
    // Siri Shortcuts donation
    prescriptions.forEach((p: any) => {
      donateMedicationTakenShortcut(p.id, p.medicationName).catch(() => undefined);
    });
    donateLogSymptomShortcut().catch(() => undefined);
    donatePanicShortcut().catch(() => undefined);
  }, [data]);

  const allDoses: Array<
    DoseEvent & { medicationName: string; doseAmount: number; doseUnit: string; foodRequirement: FoodReq }
  > =
    (data ?? []).flatMap((d: any) =>
      d.prescriptions.flatMap((p: any) =>
        (p.doses as DoseEvent[]).map((dose) => ({
          ...dose,
          medicationName: p.medication.name,
          doseAmount: p.doseAmount,
          doseUnit: p.doseUnit,
          foodRequirement: (p.foodRequirement ?? 'ANY') as FoodReq,
        }))
      )
    );
  const taken = allDoses.filter((d) => d.status === 'TAKEN_ON_TIME' || d.status === 'TAKEN_LATE').length;

  const lowStockList: LowStockItem[] = (data ?? []).flatMap((d: any) =>
    d.prescriptions
      .filter((p: any) => p.lowStock && p.stockCount != null)
      .map((p: any) => {
        const dailyDoses = Math.max(1, p.scheduleTimes.length);
        return {
          prescriptionId: p.id,
          medicationName: p.medication.name,
          remaining: p.stockCount as number,
          daysRemaining: Math.floor((p.stockCount as number) / dailyDoses),
        };
      })
  );

  const summaryText = React.useMemo(() => {
    const remaining = allDoses.length - taken;
    const next = allDoses.find((d) => d.status === 'PENDING');
    const nextStr = next
      ? `Sıradaki ${next.medicationName} saat ${new Date(next.scheduledAt).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        })}.`
      : '';
    return `Bugün ${allDoses.length} ilacınız var. ${taken} tanesini aldınız. ${remaining} bekleniyor. ${nextStr}`.trim();
  }, [allDoses, taken]);

  React.useEffect(() => {
    if (!data) return;
    if (!prefs.autoSpeakOnScreenEnter) return;
    if (announcedRef.current) return;
    announcedRef.current = true;
    speak(summaryText).catch(() => undefined);
  }, [data, prefs.autoSpeakOnScreenEnter, summaryText]);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      accessibilityLabel="Bugünün görevleri ekranı"
      contentStyle={{ padding: spacing.lg }}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Heading
            title={`Merhaba ${user?.caregiver?.fullName?.split(' ')[0] ?? ''}`}
            subtitle="Bugünün Görevleri"
          />
        </View>
        <Pressable
          onPress={() => speak(summaryText)}
          accessibilityRole="button"
          accessibilityLabel="Günün özetini sesli oku"
          accessibilityHint="Bugün alınan ve bekleyen ilaçları sesli okur"
          hitSlop={12}
          style={styles.speakBtn}
        >
          <Text style={styles.speakIcon} accessibilityElementsHidden importantForAccessibility="no">
            🔊
          </Text>
        </Pressable>
      </View>

      <AlertBanner audience="caregiver" />

      {lowStockList.length > 0 ? (
        <View style={styles.lowStockBanner} accessibilityLiveRegion="polite">
          <Text style={styles.lowStockTitle} allowFontScaling maxFontSizeMultiplier={1.6}>
            Stok azalıyor
          </Text>
          {lowStockList.map((it) => (
            <Pressable
              key={it.prescriptionId}
              onPress={() => {
                setRefillFor(it);
                setRefillAmount('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`${it.medicationName} stoğu ${it.remaining} adet kaldı, yaklaşık ${it.daysRemaining} gün. Stok eklemek için dokunun.`}
              style={styles.lowStockRow}
            >
              <Text style={styles.lowStockText} allowFontScaling maxFontSizeMultiplier={1.6}>
                {it.medicationName}: {it.remaining} adet (~{it.daysRemaining} gün)
              </Text>
              <Text style={styles.lowStockAdd}>+ Stok Ekle</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.section} accessibilityRole="header">İlaç Görevleri</Text>
      {allDoses.length === 0 ? (
        <Card>
          <Text style={typography.body}>Bugün için tanımlı ilaç yok.</Text>
        </Card>
      ) : (
        <FlatList
          data={allDoses}
          keyExtractor={(d) => d.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const time = new Date(item.scheduledAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const isTaken = item.status === 'TAKEN_ON_TIME' || item.status === 'TAKEN_LATE';
            const isMissed = item.status === 'MISSED';
            const accLabel = `${item.medicationName} ${item.doseAmount} ${item.doseUnit}, saat ${time}, ${
              isTaken ? 'alındı' : isMissed ? 'atlandı' : 'bekliyor'
            }`;
            return (
              <Pressable
                onPress={() => !isTaken && checkDose.mutate({ id: item.id })}
                disabled={isTaken}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTaken, disabled: isTaken }}
                accessibilityLabel={accLabel}
                accessibilityHint={isTaken ? 'Zaten alındı olarak işaretlendi' : 'Aldıysanız tıklayın'}
                style={[styles.doseRow, isTaken && styles.doseRowTaken, isMissed && styles.doseRowMissed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.medName} allowFontScaling maxFontSizeMultiplier={1.6}>
                    {item.medicationName} {item.doseAmount} {item.doseUnit}
                  </Text>
                  <Text style={styles.medTime} allowFontScaling maxFontSizeMultiplier={1.6}>
                    {time}
                    {FOOD_LABELS[item.foodRequirement] ? ` · ${FOOD_LABELS[item.foodRequirement]}` : ''}
                  </Text>
                </View>
                <View
                  style={[styles.tick, isTaken && styles.tickOn, isMissed && styles.tickMissed]}
                  accessibilityElementsHidden
                >
                  <Text style={styles.tickText}>{isTaken ? '✓' : isMissed ? '!' : '○'}</Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={styles.footer} accessibilityLabel={`Bugün ${taken} / ${allDoses.length} ilaç alındı`}>
              <Text style={styles.progress} allowFontScaling maxFontSizeMultiplier={1.6}>
                {taken} / {allDoses.length} Alındı
              </Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${(taken / Math.max(1, allDoses.length)) * 100}%` }]} />
              </View>
            </View>
          }
        />
      )}

      <CategoryShortcuts
        category={user?.caregiver?.disabilityCategory ?? null}
        navigation={navigation}
      />

      <Text style={styles.section} accessibilityRole="header">Atanan Hastalıklar</Text>
      <View style={styles.diseaseGrid}>
        {(data ?? []).map((d: any) => (
          <Pressable
            key={d.patientDiseaseId}
            onPress={() => navigation.navigate('DiseaseDetail', { patientDiseaseId: d.patientDiseaseId })}
            accessibilityRole="button"
            accessibilityLabel={`${d.disease.name} hastalığını aç`}
            accessibilityHint="Bugünün semptomları ve ilaçlarını görüntüler"
            style={styles.diseaseCard}
          >
            <Text style={styles.diseaseName} allowFontScaling maxFontSizeMultiplier={1.6}>
              {d.disease.name}
            </Text>
            <Text style={styles.diseaseMeta} allowFontScaling maxFontSizeMultiplier={1.6}>
              {d.symptoms.length} semptom · {d.prescriptions.length} ilaç
            </Text>
          </Pressable>
        ))}
      </View>

      <PanicButton userName={user?.caregiver?.fullName} />

      <Modal
        visible={!!refillFor}
        transparent
        animationType="fade"
        onRequestClose={() => setRefillFor(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <Text style={styles.modalTitle} allowFontScaling maxFontSizeMultiplier={1.6}>
              Stok Ekle
            </Text>
            <Text style={styles.modalSub} allowFontScaling maxFontSizeMultiplier={1.6}>
              {refillFor?.medicationName} ({refillFor?.remaining} kaldı)
            </Text>
            <TextInput
              keyboardType="numeric"
              value={refillAmount}
              onChangeText={(v) => setRefillAmount(v.replace(/[^0-9]/g, ''))}
              placeholder="Eklenen miktar"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
              accessibilityLabel="Eklenen miktar"
              accessibilityHint="Aldığınız yeni stok adetini girin"
            />
            <View style={styles.modalRow}>
              <Pressable
                onPress={() => setRefillFor(null)}
                accessibilityRole="button"
                accessibilityLabel="Vazgeç"
                style={[styles.modalBtn, styles.modalBtnGhost]}
              >
                <Text style={styles.modalBtnGhostText}>Vazgeç</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const n = Number(refillAmount);
                  if (!n || !refillFor) {
                    Alert.alert('Geçersiz', 'Eklenen miktar 1 veya üzeri olmalı.');
                    return;
                  }
                  refillMutation.mutate(
                    { id: refillFor.prescriptionId, addedCount: n },
                    {
                      onSuccess: () => {
                        setRefillFor(null);
                        setRefillAmount('');
                      },
                      onError: (e: any) => Alert.alert('Hata', e?.message ?? 'Eklenemedi'),
                    }
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Stok ekle ve kaydet"
                style={[styles.modalBtn, styles.modalBtnPrimary]}
              >
                <Text style={styles.modalBtnPrimaryText}>
                  {refillMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: TOUCH_MIN + 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doseRowTaken: { backgroundColor: colors.successBg, borderColor: colors.success },
  doseRowMissed: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  medName: { ...typography.bodyBold, color: colors.textPrimary },
  medTime: { ...typography.body, color: colors.textSecondary },
  tick: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: { backgroundColor: colors.success, borderColor: colors.success },
  tickMissed: { backgroundColor: colors.danger, borderColor: colors.danger },
  tickText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  footer: { marginTop: spacing.md },
  progress: { ...typography.bodyBold, color: colors.accent, marginBottom: spacing.xs },
  progressBg: { height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent },
  diseaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  diseaseCard: {
    flexBasis: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: TOUCH_MIN + 30,
  },
  diseaseName: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  diseaseMeta: { ...typography.caption, color: colors.textSecondary },
  lowStockBanner: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  lowStockTitle: { ...typography.bodyBold, color: colors.warning, marginBottom: spacing.xs },
  lowStockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    minHeight: TOUCH_MIN,
  },
  lowStockText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  lowStockAdd: { ...typography.bodyBold, color: colors.warning, marginLeft: spacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalTitle: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  modalSub: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  modalInput: {
    minHeight: TOUCH_MIN + 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    ...typography.body,
    marginBottom: spacing.md,
  },
  modalRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' },
  modalBtn: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  modalBtnGhostText: { ...typography.bodyBold, color: colors.textPrimary },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnPrimaryText: { ...typography.bodyBold, color: colors.textOnPrimary },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  speakBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  speakIcon: { fontSize: 22 },
});
