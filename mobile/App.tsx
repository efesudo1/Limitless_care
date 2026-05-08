import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/auth/AuthContext';
import { AccessibilityProvider } from './src/theme/AccessibilityContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';
import { registerNotificationCategories } from './src/notifications/handlers';
import { triggerPanic } from './src/emergency/panic';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  useEffect(() => {
    registerNotificationCategories();
  }, []);

  // Siri Shortcuts: tetiklenen activityType'a göre aksiyon al.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let SiriModule: any = null;
    try {
      SiriModule = require('react-native-siri-shortcut');
    } catch {
      return;
    }
    const emitter = SiriModule?.SiriShortcutsEvent;
    if (!emitter?.addListener) return;
    const sub = emitter.addListener('SiriShortcutListener', async (event: any) => {
      const activityType = event?.activityType ?? event?.userInfo?.activityType;
      if (activityType === 'com.limitlesscare.panic') {
        // Siri'den "Acil durum" deyince doğrudan panik akışını başlat.
        await triggerPanic().catch(() => undefined);
      }
      // Diğer activity'ler (medication.taken, symptom.log) navigation kontekstinde
      // ilgili ekrandan tetikleneceği için burada özel iş yok — app açılışı yeterli.
    });
    return () => sub?.remove?.();
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AccessibilityProvider>
            <AuthProvider>
              <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
              <RootNavigator />
            </AuthProvider>
          </AccessibilityProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
