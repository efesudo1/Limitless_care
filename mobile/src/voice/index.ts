/**
 * Erişilebilirlik desteği için sesli okuma (TTS) ve sesli giriş (STT) sarmalayıcıları.
 *
 * Kullanım:
 *  - speak('Bugün üç ilacınız var') — semptom açıklamalarını veya görev özetini sesli sunmak için.
 *  - startVoiceInput(callback) — semptom notu girişi gibi alanlarda kullanıcı parmak yerine konuşabilsin.
 *
 * Modüller require() ile lazy yüklenir; Bare RN derlemesinde native taraf kurulu olmazsa "yok"
 * diye sessizce geçer.
 */

let Tts: any = null;
let Voice: any = null;

try {
  Tts = require('react-native-tts').default;
  Tts?.setDefaultLanguage?.('tr-TR');
  Tts?.setDefaultRate?.(0.5);
} catch {
  /* native module not linked yet */
}

try {
  Voice = require('@react-native-voice/voice').default;
} catch {
  /* native module not linked yet */
}

export async function speak(text: string) {
  if (!Tts) return;
  try {
    await Tts.stop();
    await Tts.speak(text, { language: 'tr-TR' });
  } catch {
    /* ignore */
  }
}

export async function stopSpeaking() {
  await Tts?.stop?.();
}

export async function startVoiceInput(onResult: (text: string) => void, onError?: (msg: string) => void) {
  if (!Voice) {
    onError?.('Sesli giriş için react-native-voice modülü yüklü değil.');
    return;
  }
  Voice.onSpeechResults = (e: any) => {
    const text = e?.value?.[0];
    if (text) onResult(text);
  };
  Voice.onSpeechError = (e: any) => onError?.(e?.error?.message ?? 'Sesli giriş hatası');
  try {
    await Voice.start('tr-TR');
  } catch (err: any) {
    onError?.(err?.message ?? 'Mikrofon başlatılamadı');
  }
}

export async function stopVoiceInput() {
  await Voice?.stop?.();
  await Voice?.destroy?.();
  Voice?.removeAllListeners?.();
}
