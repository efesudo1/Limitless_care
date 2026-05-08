import { Linking, Platform, Alert, NativeModules } from 'react-native';
import { emergencyApi } from '../api/endpoints';

export type EmergencyContact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  priority: number;
};

type Coords = { latitude: number; longitude: number };

// Native modül adları paket dokümanlarından
const HAS_GEOLOCATION_NATIVE = !!(
  NativeModules.RNFusedLocation || NativeModules.RNCGeolocation
);
const HAS_PERMISSIONS_NATIVE = !!NativeModules.RNPermissions;

async function tryGetLocation(timeoutMs = 8000): Promise<Coords | null> {
  // Native modül linklenmediyse (pod install yapılmadı) hiç require etme — crash önler.
  if (!HAS_GEOLOCATION_NATIVE) return null;

  let Geolocation: any = null;
  try {
    const mod = require('react-native-geolocation-service');
    Geolocation = mod?.default ?? mod;
  } catch {
    try {
      Geolocation = require('@react-native-community/geolocation');
    } catch {
      return null;
    }
  }
  if (!Geolocation?.getCurrentPosition) return null;

  let Permissions: any = null;
  if (HAS_PERMISSIONS_NATIVE) {
    try {
      Permissions = require('react-native-permissions');
    } catch {
      Permissions = null;
    }
  }

  // Permissions handler yoksa veya hata atarsa devam et — Geolocation native API
  // izin diyaloğunu kendisi açabilir (Info.plist'te NSLocationWhenInUseUsageDescription var).
  if (Permissions?.request && Permissions?.PERMISSIONS && Permissions?.RESULTS) {
    try {
      const PERM =
        Platform.OS === 'ios'
          ? Permissions.PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : Permissions.PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await Permissions.request(PERM);
      if (result === Permissions.RESULTS.DENIED || result === Permissions.RESULTS.BLOCKED) {
        return null;
      }
    } catch {
      /* handler eksik — sessizce geç, Geolocation kendi izin diyaloğunu açar */
    }
  }

  try {
    return await new Promise<Coords | null>((resolve) => {
      const id = setTimeout(() => resolve(null), timeoutMs);
      Geolocation.getCurrentPosition(
        (pos: any) => {
          clearTimeout(id);
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => {
          clearTimeout(id);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
      );
    });
  } catch {
    return null;
  }
}

export const DEFAULT_EMERGENCY_MESSAGE =
  'Şu an kötü ve ulaşılması gereken bir durumdayım.';

function buildSmsBody(opts: {
  customMessage: string | null;
  userName: string | null;
  coords: Coords | null;
}) {
  const message = (opts.customMessage?.trim() || DEFAULT_EMERGENCY_MESSAGE).trim();
  const sender = opts.userName ? `\n— ${opts.userName}` : '';
  const map = opts.coords
    ? `https://maps.google.com/?q=${opts.coords.latitude},${opts.coords.longitude}`
    : 'Konum alınamadı';
  return `${message}\n\nKonum: ${map}${sender}`;
}

function buildSmsUrl(phones: string[], body: string) {
  const recipients = phones.join(Platform.OS === 'ios' ? ',' : ';');
  const separator = Platform.OS === 'ios' ? '&' : '?';
  // iOS Messages, URL-encoded body'yi bazen decode etmiyor (literal %XX görünüyor).
  // Türkçe karakterleri ham bırak; sadece URL parser'ı bozacak karakterleri escape et.
  const safeBody = body
    .replace(/&/g, '%26')
    .replace(/#/g, '%23')
    .replace(/\+/g, '%2B');
  return `sms:${recipients}${separator}body=${safeBody}`;
}

function sanitizePhone(raw: string): string {
  // tel: URL'i için + dışındaki tüm boşluk/parantez/tireyi temizle
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^0-9]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

async function placeCall(phone: string): Promise<boolean> {
  const tel = `tel:${sanitizePhone(phone)}`;
  try {
    const supported = await Linking.canOpenURL(tel);
    if (!supported) return false;
    await Linking.openURL(tel);
    return true;
  } catch {
    return false;
  }
}

export type TriggerPanicResult =
  | {
      ok: true;
      calledContact: EmergencyContact | null;
      smsContacts: EmergencyContact[];
      coords: Coords | null;
      message: string;
    }
  | { ok: false; reason: 'NO_CONTACTS' | 'CANCELLED' | 'ERROR'; message?: string };

export async function triggerPanic(opts?: { userName?: string }): Promise<TriggerPanicResult> {
  let contacts: EmergencyContact[] = [];
  let customMessage: string | null = null;
  try {
    contacts = await emergencyApi.contacts();
  } catch (e: any) {
    return { ok: false, reason: 'ERROR', message: e?.message ?? 'Kontaklar çekilemedi' };
  }
  if (!contacts.length) return { ok: false, reason: 'NO_CONTACTS' };

  // Custom mesajı medical-card endpoint'inden çek (best-effort, fail olursa default kullan)
  try {
    const card = await emergencyApi.getMedicalCard();
    customMessage = card?.emergencyMessage ?? null;
  } catch {
    customMessage = null;
  }

  const sorted = [...contacts].sort((a, b) => a.priority - b.priority);
  const primary = sorted[0];
  const others = sorted.slice(1, 3); // yedek 2 kontak — manuel SMS için sunulur

  const coords = await tryGetLocation();

  // 1) BIRINCIL EYLEM: 1. öncelikli kontağı otomatik ara (tel:)
  // iOS sistem onay diyaloğu gösterir, kullanıcı "Ara" basınca arama başlar.
  const called = await placeCall(primary.phone);

  if (!called) {
    Alert.alert(
      'Arama başlatılamadı',
      `${primary.name} (${primary.phone}) numarası aranamadı. Lütfen elle arayın veya kontağı kontrol edin.`
    );
  }

  // 2) Audit kaydı (background)
  try {
    await emergencyApi.recordEvent({
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      sentToContactIds: [primary.id],
      note: [
        coords ? null : 'Konum alınamadı',
        called ? `Aranıyor: ${primary.name}` : `Arama başarısız: ${primary.name}`,
      ]
        .filter(Boolean)
        .join(' | '),
    });
  } catch {
    /* audit fail panik akışını engellemez */
  }

  // 3) Yedek SMS — kullanıcı arama bittikten sonra app'e döndüğünde manuel olarak gönderebilir.
  // İade ettiğimiz `smsContacts` PanicButton tarafında ek aksiyon olarak sunulur.
  const finalMessage = (customMessage?.trim() || DEFAULT_EMERGENCY_MESSAGE).trim();

  return {
    ok: true,
    calledContact: called ? primary : null,
    smsContacts: others,
    coords,
    message: finalMessage,
  };
}

/**
 * Arama bittikten sonra (kullanıcı app'e döndüğünde) ek kontaklara SMS açar.
 * PanicButton sonuçtaki smsContacts > 0 ise kullanıcıya "Ek kişilere mesaj gönder" seçeneği sunar.
 */
export async function sendBackupSms(
  contacts: EmergencyContact[],
  coords: Coords | null,
  userName: string | null,
  customMessage: string | null = null
): Promise<boolean> {
  if (!contacts.length) return false;
  const body = buildSmsBody({ customMessage, userName, coords });
  const smsUrl = buildSmsUrl(
    contacts.map((c) => c.phone),
    body
  );
  try {
    const supported = await Linking.canOpenURL(smsUrl);
    if (!supported) return false;
    await Linking.openURL(smsUrl);
    return true;
  } catch {
    return false;
  }
}
