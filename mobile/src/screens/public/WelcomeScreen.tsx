import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Heading } from '../../components/Heading';
import { colors, spacing, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/PublicStack';

type Props = NativeStackScreenProps<PublicStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen background={'#E6F4F3'} accessibilityLabel="Limitless Care karşılama ekranı">
      <View style={styles.hero}>
        <Heading title="Limitless Care" subtitle="Sağlığınız İçin Akıllı Takip" />
      </View>
      <View style={styles.actions}>
        <PrimaryButton
          label="Doktor Olarak Kayıt Ol"
          accessibilityHint="Doktor hesabı oluşturma ekranını açar"
          onPress={() => navigation.navigate('RegisterDoctor')}
        />
        <View style={{ height: spacing.md }} />
        <PrimaryButton
          variant="secondary"
          label="Hasta Takip Olarak Kayıt Ol"
          accessibilityHint="Hasta takip hesabı oluşturma ekranını açar"
          onPress={() => navigation.navigate('RegisterCaregiver')}
        />
        <View style={{ height: spacing.md }} />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          accessibilityLabel="Zaten hesabım var, giriş yap"
          hitSlop={10}
          style={styles.loginRow}
        >
          <Text style={styles.loginText} allowFontScaling maxFontSizeMultiplier={1.6}>
            Zaten Hesabım Var
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxl },
  actions: { paddingBottom: spacing.xl },
  loginRow: { alignItems: 'center', paddingVertical: spacing.md },
  loginText: { ...typography.bodyBold, color: colors.primaryDark, textDecorationLine: 'underline' },
});
