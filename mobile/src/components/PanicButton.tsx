import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Easing,
  AccessibilityInfo,
  Alert,
  Vibration,
  View,
} from 'react-native';
import { triggerPanic, sendBackupSms } from '../emergency/panic';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  userName?: string;
  /** Default 3000ms — 3 sn basılı tutma. */
  holdMs?: number;
};

export function PanicButton({ userName, holdMs = 3000 }: Props) {
  const [busy, setBusy] = useState(false);
  const [holding, setHolding] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const start = () => {
    if (busy) return;
    setHolding(true);
    Vibration.vibrate(50);
    AccessibilityInfo.announceForAccessibility('Panik tetiklemesi için 3 saniye basılı tutun');
    Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
    timer.current = setTimeout(async () => {
      setHolding(false);
      setBusy(true);
      Vibration.vibrate([0, 200, 100, 200]);
      try {
        const result = await triggerPanic({ userName });
        if (result.ok) {
          if (result.calledContact) {
            AccessibilityInfo.announceForAccessibility(
              `${result.calledContact.name} aranıyor`
            );
          }
          // Arama açıldıktan sonra ek kontaklara SMS göndermeyi öner.
          if (result.smsContacts.length > 0) {
            // Arama diyaloğu app'i background'a aldığı için Alert biraz gecikmeli açılır.
            setTimeout(() => {
              Alert.alert(
                'Ek kontaklara mesaj',
                `${result.smsContacts
                  .map((c) => c.name)
                  .join(', ')} kişilerine de konum içeren acil mesaj gönderilsin mi?`,
                [
                  { text: 'Hayır', style: 'cancel' },
                  {
                    text: 'Evet, Gönder',
                    onPress: () =>
                      sendBackupSms(
                        result.smsContacts,
                        result.coords,
                        userName ?? null,
                        result.message
                      ),
                  },
                ]
              );
            }, 1500);
          }
        } else if (result.reason === 'NO_CONTACTS') {
          Alert.alert(
            'Acil kontak yok',
            'Önce profil ekranından en az bir acil durum kontağı ekleyin.'
          );
        } else {
          Alert.alert('Panik tetiklenemedi', result.message ?? 'Beklenmeyen hata.');
        }
      } finally {
        setBusy(false);
        progress.setValue(0);
      }
    }, holdMs);
  };

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    progress.stopAnimation();
    progress.setValue(0);
    setHolding(false);
  };

  const widthInterp = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel="Panik butonu"
      accessibilityHint="Acil mesaj göndermek için 3 saniye basılı tutun"
      accessibilityState={{ disabled: busy, busy }}
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed, busy && styles.fabBusy]}
    >
      <View style={styles.fill} pointerEvents="none">
        <Animated.View style={[styles.fillBar, { width: widthInterp }]} />
      </View>
      <Text style={styles.icon} accessibilityElementsHidden importantForAccessibility="no">
        🆘
      </Text>
      <Text style={styles.label} allowFontScaling maxFontSizeMultiplier={1.4}>
        {busy ? 'Gönderiliyor…' : holding ? 'Bekleyin…' : 'PANİK'}
      </Text>
    </Pressable>
  );
}

const SIZE = 88;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    minWidth: SIZE,
    minHeight: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    paddingHorizontal: spacing.md,
  },
  fabPressed: { opacity: 0.92 },
  fabBusy: { opacity: 0.6 },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  fillBar: { height: '100%', backgroundColor: '#7a1d1d', opacity: 0.5 },
  icon: { fontSize: 28, color: colors.textOnPrimary },
  label: {
    ...typography.bodyBold,
    color: colors.textOnPrimary,
    fontSize: 13,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
});
