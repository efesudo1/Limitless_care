import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useAuth } from '../../auth/AuthContext';
import { colors, spacing, typography } from '../../theme';

export function PendingApprovalScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const isRejected = user?.doctor?.status === 'REJECTED';

  return (
    <Screen accessibilityLabel="Doktor onay bekleme ekranı">
      <Heading
        title={isRejected ? 'Hesabınız Reddedildi' : 'Onay Bekleniyor'}
        subtitle={
          isRejected
            ? 'Owner hesabınızı reddetti. Detay için yöneticinizle iletişime geçin.'
            : 'Owner doktor onayını verdiğinde bildirim göreceksiniz.'
        }
      />
      <Card>
        <Text style={styles.body} allowFontScaling maxFontSizeMultiplier={1.6}>
          Hesap durumu: {user?.doctor?.status ?? 'PENDING'}
        </Text>
        <Text style={[styles.body, { marginTop: spacing.sm }]} allowFontScaling maxFontSizeMultiplier={1.6}>
          {user?.doctor?.fullName} • {user?.doctor?.specialty}
        </Text>
      </Card>
      <View style={{ height: spacing.md }} />
      <PrimaryButton
        label="Durumu Yenile"
        accessibilityHint="Hesap onay durumunu sunucudan tekrar kontrol eder"
        onPress={refreshProfile}
      />
      <View style={{ height: spacing.md }} />
      <PrimaryButton variant="ghost" label="Çıkış Yap" onPress={logout} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...typography.body, color: colors.textSecondary },
});
