/**
 * iOS Siri Shortcuts entegrasyonu — yalnızca iOS'ta etkin olur.
 * "Hey Siri, ilacımı aldım" gibi kısayollar için NSUserActivity bağlantısı kurulur.
 *
 * react-native-siri-shortcut native module'ü kuruluysa kullanılır; aksi takdirde
 * fonksiyonlar sessizce no-op olur (Android, henüz pod install edilmemiş cihaz vb.).
 */

import { Platform } from 'react-native';

let SiriShortcutsModule: any = null;
try {
  if (Platform.OS === 'ios') {
    SiriShortcutsModule = require('react-native-siri-shortcut');
  }
} catch {
  /* native module not linked yet */
}

export async function donateMedicationTakenShortcut(prescriptionId: string, medicationName: string) {
  if (Platform.OS !== 'ios' || !SiriShortcutsModule?.donateShortcut) return;
  try {
    await SiriShortcutsModule.donateShortcut({
      activityType: 'com.limitlesscare.medication.taken',
      title: `${medicationName} aldım`,
      userInfo: { prescriptionId },
      keywords: ['ilaç', 'aldım', medicationName],
      persistentIdentifier: `med-taken-${prescriptionId}`,
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      suggestedInvocationPhrase: `${medicationName} aldım`,
    });
  } catch {
    /* ignore */
  }
}

export async function donateLogSymptomShortcut() {
  if (Platform.OS !== 'ios' || !SiriShortcutsModule?.donateShortcut) return;
  try {
    await SiriShortcutsModule.donateShortcut({
      activityType: 'com.limitlesscare.symptom.log',
      title: 'Semptom kaydet',
      keywords: ['semptom', 'kaydet'],
      persistentIdentifier: 'log-symptom',
      isEligibleForSearch: true,
      isEligibleForPrediction: true,
      suggestedInvocationPhrase: 'Semptom kaydet',
    });
  } catch {
    /* ignore */
  }
}
