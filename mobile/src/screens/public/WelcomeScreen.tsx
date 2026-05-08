import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../api/client';
import { colors, radius, spacing, TOUCH_MIN, typography } from '../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PublicStackParamList } from '../../navigation/PublicStack';

type Props = NativeStackScreenProps<PublicStackParamList, 'Welcome'>;

const HERO = require('../../assets/welcome-illustration.png');

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} accessibilityLabel="Limitless Care karşılama ekranı">
      <View style={styles.container}>
        <View style={styles.heroBlock}>
          <Text
            style={styles.title}
            allowFontScaling
            maxFontSizeMultiplier={1.3}
            accessibilityRole="header"
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            Limitless{'\n'}Care
          </Text>
          <Text style={styles.subtitle} allowFontScaling maxFontSizeMultiplier={1.4}>
            Sağlığınız İçin Akıllı Takip
          </Text>
          <View style={styles.illustrationWrap}>
            <Image
              source={HERO}
              style={styles.illustration}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('RegisterDoctor')}
            accessibilityRole="button"
            accessibilityLabel="Doktor Olarak Kayıt Ol"
            accessibilityHint="Doktor hesabı oluşturma ekranını açar"
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          >
            <Text style={styles.btnPrimaryText} allowFontScaling maxFontSizeMultiplier={1.4}>
              Doktor Olarak Kayıt Ol
            </Text>
          </Pressable>

          <View style={{ height: spacing.md }} />

          <Pressable
            onPress={() => navigation.navigate('RegisterCaregiver')}
            accessibilityRole="button"
            accessibilityLabel="Hasta Takip Olarak Kayıt Ol"
            accessibilityHint="Hasta takip hesabı oluşturma ekranını açar"
            style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.btnSecondaryText} allowFontScaling maxFontSizeMultiplier={1.4}>
              Hasta Takip Olarak Kayıt Ol
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
            accessibilityLabel="Zaten hesabım var, giriş yap"
            hitSlop={12}
            style={styles.loginLink}
          >
            <Text style={styles.loginIcon} accessibilityElementsHidden importantForAccessibility="no">
              👤
            </Text>
            <Text style={styles.loginText} allowFontScaling maxFontSizeMultiplier={1.6}>
              Zaten Hesabım Var
            </Text>
          </Pressable>

          {__DEV__ ? (
            <View style={styles.debug}>
              <Text style={styles.debugText} selectable>
                Metro: {(NativeModules as any).SourceCode?.scriptURL ?? 'undefined'}
              </Text>
              <Text style={styles.debugText} selectable>
                API: {API_BASE_URL}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  heroBlock: { alignItems: 'center', flex: 1 },
  title: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  illustrationWrap: {
    flex: 1,
    width: '100%',
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    flex: 1,
    width: '100%',
  },
  actions: { paddingTop: spacing.md },
  btnPrimary: {
    minHeight: TOUCH_MIN + 12,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  btnPrimaryText: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  btnSecondary: {
    minHeight: TOUCH_MIN + 12,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnSecondaryText: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  loginIcon: { fontSize: 18, color: colors.primaryDark },
  loginText: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  debug: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: '#FFF7CC', borderRadius: 6 },
  debugText: { ...typography.caption, color: '#5C4400' },
});
