# Limitless Care

Doktor + Hasta Takip (Caregiver) için tasarlanmış erişilebilir mobil uygulama. Doktor hastalık atar ve reçete yazar; bakıcı/hasta günlük semptom + ilaç görevlerini doldurur; sistem PDF/Excel raporlar üretir. Owner hesabı sistemdeki hastalık/semptom/ilaç kataloğunu yönetir ve doktor onaylarını verir.

## Yapı

| Klasör | Stack | Açıklama |
| --- | --- | --- |
| [backend/](backend/) | Node.js + Express + TypeScript + Prisma + PostgreSQL | Auth, doctor, caregiver, owner, catalog, reports |
| [mobile/](mobile/) | Bare React Native (TypeScript) | Doktor + hasta için iOS/Android uygulaması; WCAG erişilebilirlik, local notifications, sesli giriş ve Siri Shortcuts |
| [admin-web/](admin-web/) | React + Vite + TypeScript | Owner web paneli: doktor onayı, hastalık/semptom/ilaç CRUD |
| [docs/](docs/) | Markdown | End-to-end test senaryosu |

## Önkoşullar

- Docker + Docker Compose
- Node.js >= 20
- iOS build için: Xcode + CocoaPods
- Android build için: Android Studio + JDK 17

## Hızlı Kurulum

```bash
# 1) PostgreSQL
docker compose up -d postgres

# 2) ortam değişkenleri
cp .env.example .env

# 3) Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed                       # 46 hastalık + ~460 semptom + ilaç + owner hesabı
npm run dev                           # http://localhost:4000

# 4) Admin web
cd ../admin-web
npm install
npm run dev                           # http://localhost:5173

# 5) Mobile (Bare RN)
cd ../mobile
npm install
# iOS:
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
# Android:
npm run android
```

## Owner Giriş Bilgileri (seed)

`.env` içindeki `OWNER_EMAIL` ve `OWNER_PASSWORD` değerleri (varsayılan: `owner@limitlesscare.local` / `Owner!2024Dev`).

## Mimari Notlar

- **Üç kullanıcı tipi**: `DOCTOR` (PENDING → APPROVED → REJECTED), `CAREGIVER`, `OWNER`.
- **Doktor onayı**: diploma numarası girer, owner web panelinden onaylanır.
- **E-posta ön atama**: doktor henüz var olmayan e-postaya hastalık atayabilir; hasta kayıt olunca otomatik ACTIVE'e çekilir.
- **İlaç uyum takibi**: `Prescription.scheduleTimes` × tarih kombinasyonları lazy materialize edilir; bakıcı tikleyince zamanında / geç / atlanmış olarak hesaplanır.
- **Raporlar**: `pdfkit` + `exceljs` ile semptom severity dağılımı + ilaç uyum yüzdesi. Mobile'dan tarayıcıda imzalı query token ile indirilir.
- **Auth**: JWT access (15dk) + refresh (30g). Mobile axios interceptor 401'de otomatik refresh + retry yapar.
- **Erişilebilirlik (mobil)**: tüm Pressable/TextInput'larda `accessibilityLabel`+`accessibilityHint`+`accessibilityRole`; checkbox/radio rolleri; başlığa otomatik focus; renk kontrast WCAG AA; yerleşik TTS + STT; iOS Siri Shortcuts; native tarih seçici.
- **Görsel rapor**: doktor PatientDetail'de semptom şiddet dağılımı bar grafiği (özel `SeverityChart` bileşeni — tek bir kütüphane bağımlılığı yok, screen reader'a sözel özet verir).
- **Yerel bildirim**: `@notifee/react-native` ile reçete saatlerine günlük tekrar; cihaz yeniden başlasa bile korunur.
- **Native izinler hazır**: iOS Info.plist (`NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `NSSiriUsageDescription`, `NSUserActivityTypes`) + Android Manifest (`RECORD_AUDIO`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`).
- **Doktor katalog yönetimi**: mobil ekran üzerinden custom hastalık/semptom ekler; sistem hastalıklarına da semptom ekleyebilir (custom semptom).

## End-to-end Manuel Test

`docs/verification.md` dosyasında 14 adımlı senaryo. v1'in kabul kriteri budur.
