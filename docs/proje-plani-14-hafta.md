# 🏥 Limitless Care — 14 Haftalık Proje Planı

**Proje:** Limitless Care — Doktor + Hasta Takip Mobil Uygulaması
**Repo:** `/Users/efe49/Desktop/limitlescare`
**Ekip:** Ahmet Efe (PM & Backend) · Abdussamed Ateş (Frontend) · Nehir Bozbey (DevOps)
**Bağımlılık Sırası:** Nehir → Ahmet Efe → Abdussamed

## Stack Özeti
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Veritabanı:** PostgreSQL (Docker container)
- **Mobile:** Bare React Native 0.85 (TypeScript) — iOS + Android
- **Admin Web Paneli:** React 18 + Vite + TypeScript (owner için)
- **Auth:** JWT (15 dk access + 30 g refresh) + bcrypt
- **Bildirim:** Yalnızca local notifications (`@notifee/react-native`) — push backend yok
- **Rapor:** `pdfkit` + `exceljs`
- **Erişilebilirlik:** WCAG 2.2 AA, TTS (`react-native-tts`), STT (`@react-native-voice/voice`), iOS Siri Shortcuts

## Üç Kullanıcı Tipi
- **`DOCTOR`** — diploma numarası ile kayıt olur, owner onayından (PENDING → APPROVED) sonra hasta atayabilir
- **`CAREGIVER`** (Hasta Takip) — kendi sağlığını ya da baktığı kişiyi izler; boy/kilo/yaş/cinsiyet kayıtlıdır; günlük semptom + ilaç görevlerini doldurur
- **`OWNER`** — admin web panelinden doktor onaylar ve hastalık/semptom/ilaç kataloğunu yönetir

---

## 📌 Faz 1 — Altyapı & Ortam Kurulumu (Hafta 1–2)

### G-01
- **Görev Adı:** Docker Compose Ortamı (PostgreSQL)
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `docker-compose.yml` dosyası yazılır; `postgres:16-alpine` container'ı, named volume (`pgdata`), healthcheck ve port mapping (5432) ile yapılandırılır. `.env.example` dosyası repo köküne eklenir; `DATABASE_URL`, `JWT_*`, `OWNER_*`, `REPORTS_DIR` değişkenleri tanımlanır.
- **Kabul Kriteri:** `docker compose up -d postgres` ile DB ayağa kalkar; `docker exec ... pg_isready` healthy döner; `psql` ile bağlanılabilir; volume verisi container restart sonrası korunur.

---

### G-02
- **Görev Adı:** CI/CD Pipeline (GitHub Actions)
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `main` ve `develop` için iki ayrı workflow yazılır. Her PR'da: backend `tsc --noEmit`, mobile `tsc --noEmit`, admin-web `tsc -b`, prisma `validate`. PR'lar başarısız job ile merge edilemez. Backend için Docker image build & push (GHCR) adımı eklenir.
- **Kabul Kriteri:** Her PR'da 4 ayrı job (backend/mobile/admin-web/docker) yeşil yanıyor; başarısız job merge'ü engelliyor; image GHCR'da etiketli olarak yer alıyor.

---

### G-03
- **Görev Adı:** Prisma Şema Tasarımı ve İlk Migrasyon
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** PostgreSQL üzerinde aşağıdaki Prisma modelleri yazılır:

```
User                — id, email, passwordHash, role (DOCTOR/CAREGIVER/OWNER)
DoctorProfile       — diplomaNumber, title, specialty, status (PENDING/APPROVED/REJECTED)
CaregiverProfile    — fullName, gender, birthDate
PatientMetric       — heightCm, weightKg, recordedAt   (boy/kilo geçmişi)
Disease             — name, category (5'li enum), description, isSystem, createdById
Symptom             — diseaseId, name, description, isSystem
Medication          — name, defaultUnit, description
PatientDisease      — caregiverEmail (önatama), caregiverId, diseaseId, doctorId, status
SymptomLog          — patientDiseaseId, symptomId, severity (MILD/MODERATE/SEVERE), loggedAt
Prescription        — medicationId, doseAmount, doseUnit, scheduleTimes[], startsOn, endsOn
DoseEvent           — prescriptionId, scheduledAt, takenAt, status (PENDING/TAKEN_ON_TIME/TAKEN_LATE/MISSED)
Report              — doctorId, caregiverId, patientDiseaseId, format (PDF/EXCEL), filePath
```

İlişkiler ve unique constraint'ler (`User.email`, `DoctorProfile.diplomaNumber`, `DoseEvent[prescriptionId, scheduledAt]`) tanımlanır. `npx prisma migrate dev --name init` ile ilk migrasyon SQL'i üretilir.
- **Kabul Kriteri:** `prisma validate` temiz; ilk migration `prisma/migrations/` altında commit edildi; `prisma generate` ile typesafe client oluşturuluyor; her model için index'ler (`caregiverEmail`, `caregiverId`, `loggedAt`) tanımlı.

---

### G-04
- **Görev Adı:** React Native (Bare) Proje İskeleti & Tema Sistemi
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `npx @react-native-community/cli init LimitlessCareMobile --skip-install` ile bare RN 0.85 projesi oluşturulur. `src/{api,auth,components,navigation,screens,theme,notifications,voice,siri}` dizin yapısı kurulur. WCAG AA renk paleti, `spacing`, `radius`, `typography`, `TOUCH_MIN=44` token'ları `src/theme/index.ts` içinde tanımlanır. Ortak bileşenler: `Screen`, `PrimaryButton`, `TextField`, `Heading` (auto-focus), `Card`, `ErrorBanner`. Ayrıca admin için `admin-web/` Vite projesi iskelesi kurulur.
- **Kabul Kriteri:** `cd mobile && npx tsc --noEmit` exit 0; `cd admin-web && npx tsc -b` exit 0; tema renk kontrastları 4.5:1 üstünde; bileşenler tek bir Storybook benzeri dummy ekranda render olur.

---

## 📌 Faz 2 — Kimlik Doğrulama & Yetkilendirme (Hafta 3–4)

### G-05
- **Görev Adı:** Auth API (Register, Login, Refresh, Role Guard)
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `POST /auth/register/doctor`, `POST /auth/register/caregiver` (boy/kilo/cinsiyet/doğum tarihi alır + bekleyen `PatientDisease` kayıtlarını ACTIVE'e çeker), `POST /auth/login`, `POST /auth/refresh` endpoint'leri yazılır. Şifreler `bcryptjs` (10 round) ile hash'lenir. JWT access (15 dk) + refresh (30 g) signing & verifying kütüphaneleri (`src/lib/jwt.ts`) kurulur. `authenticate` middleware token'ı header'dan **veya** `?t=` query param'dan okur (rapor indirme için). `requireRole(...)` ve `requireApprovedDoctor` middleware'leri eklenir.
- **Kabul Kriteri:** Postman koleksiyonu ile dört endpoint test edilir; yanlış role ile korumalı rotaya 403 döner; expired access token sonrası refresh ile yeni token alınır; doktor PENDING ise `/doctor/*` endpoint'leri 403.

---

### G-06 ⭐ MILESTONE
- **Görev Adı:** Doktor Onay + E-posta Üzerinden Ön Atama Akışı
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** Üç parçalı kritik akış:

  1. **Doktor onayı:** `POST /owner/doctors/:id/approve` ve `/reject { reason }` ile owner status'ü değiştirir. Doktor PENDING/REJECTED ise mobile uygulamada yalnızca "Onay Bekleniyor / Reddedildi" ekranı görünür.
  2. **E-posta ön atama:** `POST /doctor/assignments { caregiverEmail, diseaseId }` çağrısında e-posta normalize edilir (`toLowerCase().trim()`), `User` aranır:
     - Varsa → `PatientDisease` kaydı `caregiverId` + `status=ACTIVE` + `activatedAt=now`
     - Yoksa → `caregiverId=null`, `status=PENDING_USER`
  3. **Otomatik aktivasyon:** Caregiver kayıt olduğu anda transaction içinde `PatientDisease.updateMany({ where: { caregiverEmail, status: PENDING_USER } })` ile bekleyen tüm atamalar ACTIVE'e çekilir.

  KVKK notu: hasta kayıt olmadan önce e-postası saklanır; bu durum `docs/kvkk.md`'de açıkça belirtilir, hasta kayıt olduğunda doktor bilgisini görür.

- **Kabul Kriteri:** Onay akışı uçtan uca çalışır; PENDING doktor `/doctor/patients` çağırınca 403; var olmayan e-postaya atama PENDING_USER yaratır; e-posta sahibi kayıt olunca aynı `PatientDisease.id` ACTIVE'e döner; KVKK notu repoda `docs/kvkk.md` olarak yer alır.

---

### G-07
- **Görev Adı:** SSL/TLS + Nginx Reverse Proxy + Güvenlik Header'ları
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `docker-compose.prod.yml`'a `nginx` ve `certbot` container'ları eklenir. Let's Encrypt sertifikası otomatik yenilenir. Nginx, backend (`:4000`) ve admin-web (`:5173` build) için ayrı upstream'ler kurar. Backend Express katmanına `helmet`, `cors`, ve rate limit (`express-rate-limit`: 100 req/15dk) middleware'leri eklenir.
- **Kabul Kriteri:** `https://api.limitlesscare.app` üzerinden geçerli sertifikayla erişilir; HTTP otomatik HTTPS'e yönlenir; `nmap` taraması yalnızca 80/443 açık gösterir; `curl -I` çıktısında `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` görünür.

---

### G-08
- **Görev Adı:** Welcome / Login / Register Ekranları (Mobile)
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `WelcomeScreen` ("Doktor Olarak Kayıt Ol" / "Hasta Takip Olarak Kayıt Ol" / "Zaten Hesabım Var"), `LoginScreen`, `RegisterDoctorScreen` (Ad Soyad, E-posta, Şifre, Doktor Kimliği, Unvan, Uzmanlık), `RegisterCaregiverScreen` (kişisel bilgiler + cinsiyet radio + doğum tarihi `DateField` + boy/kilo) yazılır. Token saklama `AsyncStorage` (`src/auth/storage.ts`) üzerinden; Keychain'e taşımak ileri faz. Axios interceptor 401'de otomatik refresh + retry yapar.
- **Kabul Kriteri:** Üç form da backend ile uçtan uca çalışır; doktor kayıt sonrası "Onay Bekleniyor" ekranına gider; hatalı şifre ile login `accessibilityLiveRegion="polite"` ile screen reader'a duyurulur; expire olmuş token sonrası mevcut işlem kullanıcıya hissettirilmeden refresh ile devam eder.

---

## 📌 Faz 3 — Çekirdek Modüller & API'ler (Hafta 5–8)

### G-09
- **Görev Adı:** Hastalık + Semptom + İlaç Kataloğu Seed
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `backend/prisma/data/` altında 5 kategori dosyası:

  - `diseases-mental-developmental.ts` (13 hastalık: Otizm, Asperger, DEHB, Down, Zihinsel Yetersizlik, Rett, Frajil X, Williams, Disleksi, Diskalkuli, Disgrafi, Konuşma-Dil, Tourette)
  - `diseases-mental-health.ts` (9 hastalık: Şizofreni, Bipolar, Major Depresyon, Yaygın Anksiyete, Panik, Sosyal Anksiyete, OKB, TSSB, Yeme Bozuklukları)
  - `diseases-neuro-physical.ts` (12 hastalık: Serebral Palsi, MS, ALS, Parkinson, Alzheimer, Vasküler Demans, Epilepsi, Spina Bifida, Duchenne, Omurilik Yaralanması, İnme Sonrası, Migren)
  - `diseases-sensory.ts` (Görme + İşitme Yetersizliği)
  - `diseases-chronic.ts` (10 hastalık: Tip 1/2 Diyabet, HT, Astım, KOAH, Koroner Kalp, Kronik Böbrek, Romatoid Artrit, SLE, Fibromiyalji)

  Her hastalığa **DSM-5 / ICD-11 / Mayo Clinic kaynaklı en az 10 medical-grade semptom** Türkçe çevirisiyle yazılır. `medications.ts`'de ~50 yaygın ilaç (Metformin, Lisinopril, Salbutamol, Sertralin, Levodopa, Donepezil, vb.) birim ve açıklamasıyla tanımlanır. `seed.ts` orkestratorü idempotent: tekrar çalıştırılırsa duplicate yaratmaz.
- **Kabul Kriteri:** `npm run db:seed` çıktısı: "+46 hastalık, +460 semptom, +51 medications, owner oluşturuldu"; ikinci çalıştırma "+0" döner; her hastalık için minimum 10 semptom var; Prisma Studio'da kategori dağılımı doğrulandı.

---

### G-10
- **Görev Adı:** Doctor Modülü API (Assignment, Prescription, Custom Catalog, Timeline)
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `requireApprovedDoctor` middleware altında:

  - `GET /doctor/me`, `GET /doctor/patients` (caregiver listesi + son boy/kilo)
  - `POST /doctor/assignments` — G-06'daki ön atama servisi
  - `POST /doctor/prescriptions` (medikasyon, doz, schedule_times, başlangıç/bitiş)
  - `PATCH /doctor/prescriptions/:id`, `POST /doctor/prescriptions/:id/end`
  - `GET /doctor/patients/:patientDiseaseId/timeline?from&to` — semptom log + dose event + reçete
  - `POST /doctor/diseases` ve `POST /doctor/diseases/:id/symptoms` — doktorun custom hastalık ve semptom eklemesi (`isSystem=false`, `createdById=doctorId`)
- **Kabul Kriteri:** Tüm endpoint'ler Postman'de yeşil; başka doktorun reçetesini PATCH etmek 403 döner; custom semptom system hastalığa eklendiğinde caregiver Today'de görür; timeline iki tarafta da aynı veriyi döner.

---

### G-11
- **Görev Adı:** Caregiver Modülü API (Today, Dose Materialization, Symptom Log, Metrics)
- **Atanan:** Ahmet Efe
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `requireRole(CAREGIVER)` altında:

  - `GET /me/profile` — profil + atanmış hastalıklar + boy/kilo geçmişi
  - `PATCH /me/metrics { heightCm, weightKg }` — yeni `PatientMetric` satırı ekler (eski değerler korunur)
  - `GET /me/diseases`, `GET /me/today`, `GET /me/diseases/:id/history`
  - `POST /me/symptom-logs` (severity = MILD/MODERATE/SEVERE, loggedAt otomatik)
  - `POST /me/dose-events/:id/check { takenAt }` — `delayMinutes ≤ 30` → TAKEN_ON_TIME, sonrası TAKEN_LATE

  **Kritik:** `today.service.ts` içindeki `syncDoses(caregiverId)` fonksiyonu, aktif reçeteler için `scheduleTimes × tarih` kombinasyonlarını **lazy materialize** eder (PENDING olarak upsert). 60 dk önce zamanlanmış ve hâlâ PENDING olan dose'lar otomatik MISSED'e çekilir. Europe/Istanbul timezone üzerinden hesaplanır (`dayjs.tz`).
- **Kabul Kriteri:** Sabah Today çağrısı bugünkü dose'ları üretir; bir dozu tikleyince `delay_minutes` doğru hesaplanır; öğleyi geçmiş işaretlenmemiş dozlar MISSED olur; boy/kilo geçmişi `recordedAt` ile sıralı döner.

---

### G-12
- **Görev Adı:** Owner Web Admin Paneli (Vite + React)
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `admin-web/` projesi:

  - `LoginPage` — yalnızca `OWNER` role kabul eder; aksi halde "Owner yetkisi gerekli" hatası
  - `PendingDoctorsPage` — durum filtresi (PENDING/APPROVED/REJECTED), her satır için onayla/reddet butonu (red sebebi metin alanı zorunlu)
  - `DiseasesPage` — sol kolonda hastalık tablosu + yeni hastalık formu, sağ kolonda seçili hastalığın semptom yöneticisi
  - `MedicationsPage` — ilaç CRUD tablosu

  Vite proxy ile `/api` → `http://localhost:4000`. Token `localStorage.lc.owner.token` altında saklanır.
- **Kabul Kriteri:** `npm run dev` ile `http://localhost:5173` açılır; owner login → 4 sayfa arasında React Router ile dolaşılır; PENDING doktor listesi mobile kayıt sonrası anında görünür; semptom CRUD anında listeyi günceller.

---

### G-13
- **Görev Adı:** Doctor Mobile Stack (Home, Patients, Detail, AssignDisease, Prescription, CatalogManage, Profile)
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** Tab navigator (Ana Sayfa / Hastalar / Raporlar / Profil) + kapsamlı Stack:

  - `DoctorHomeScreen` — istatistik kartları (Toplam Hasta, Bekleyen Onay), son hasta listesi, hızlı eylem
  - `PatientListScreen` — arama + hasta kartları
  - `PatientDetailScreen` — boy/kilo, atanmış hastalıklar, **`SeverityChart`** (semptom severity bar grafiği), reçete listesi, "Yeni Reçete Ekle"
  - `AssignDiseaseScreen` — kategori chip'leri + hastalık seçici + e-posta input
  - `PrescriptionFormScreen` — ilaç seçimi, doz, **preset saat chip'leri** (08:00, 12:00, 14:00, 18:00, 20:00, 22:00), `DateField` ile başlangıç tarihi
  - `CatalogManageScreen` — Profile'dan erişilen, doktorun custom hastalık/semptom ekleyebildiği ekran

  Veri katmanı `@tanstack/react-query` ile yönetilir.
- **Kabul Kriteri:** Doktor end-to-end akışı (onaylı doktor → hasta atama → reçete → rapor) mobile'da kesintisiz çalışır; SeverityChart her semptom için "hafif/orta/ağır" sayısını yan yana çubuklarla gösterir; React Query cache yenilenince UI güncellenir.

---

### G-14
- **Görev Adı:** Monitoring & Log Yönetimi
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🟠 Orta
- **İş Tanımı:** Production stack'e Loki + Promtail + Grafana eklenir. Backend Express'te `pino` logger kurulur (request-id + duration log'lanır). Kritik hata desenleri için Grafana alert (Slack webhook'a giden). PostgreSQL slow query log'u Loki'ye akar.
- **Kabul Kriteri:** Grafana dashboard'da request rate, p95 latency ve error rate paneli; 5 dakikada 5'ten fazla 5xx hatası Slack'e bildirim gönderir; Postgres slow query (>200ms) log'lanır.

---

## 📌 Faz 4 — Raporlama, Bildirim & Caregiver Mobile (Hafta 9–11)

### G-15
- **Görev Adı:** PDF + Excel Rapor Üreticileri
- **Atanan:** Ahmet Efe
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `src/modules/reports/` altında:

  - `aggregator.ts` — `buildReportData(patientDiseaseId, periodStart, periodEnd)`: semptom severity dağılımı (MILD/MODERATE/SEVERE sayıları her semptom için) + dose event istatistiği (onTime/late/missed/pending/total) + uyum yüzdesi `(onTime + late) / total`
  - `pdf.ts` — `pdfkit` ile çok bölümlü PDF (hasta bilgi, doktor, hastalık, severity tablosu, ilaç uyumu, semptom timeline)
  - `excel.ts` — `exceljs` ile 5 sayfalık workbook (Özet / Semptom Özeti / Semptom Timeline / Reçeteler / Boy-Kilo Geçmişi)
  - `POST /reports`, `GET /reports`, `GET /reports/:id/download` (token query desteği ile mobile Linking üzerinden indirilir)
- **Kabul Kriteri:** Doktor PatientDetail'den 30 günlük rapor üretir, `?t=<token>` ile tarayıcıda açılır; PDF'te uyum yüzdesi sayısal görünür; Excel'in "Reçeteler" sayfasında her reçete için ayrı satır; `Report` tablosunda kayıt yer alır.

---

### G-16
- **Görev Adı:** Caregiver Mobile Stack (Today, DiseaseDetail, Profile, EditMetrics)
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** Tab navigator (Bugün / Profil) + Stack:

  - `TodayScreen` — "Bugünün Görevleri" başlığı; FlatList ile dose event'leri (`accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`); ilerleme barı ("2/3 Alındı"); altta atanmış hastalık grid'i
  - `DiseaseDetailScreen` — semptom kartları (Hafif/Orta/Ağır chip'leri, `accessibilityRole="radio"`); günün ilaçları + tikleme; "Semptomları Kaydet" butonu pending değişiklikleri toplu gönderir
  - `CaregiverProfileScreen` — e-posta, atanmış hastalık chip'leri, doktor kartı, son boy/kilo
  - `EditMetricsScreen` — yeni ölçüm formu (eski değer önceki olarak gösterilir)

- **Kabul Kriteri:** Caregiver günlük akışını (semptom işaretle → dozları tikle → kaydet) bir oturumda tamamlar; ölçüm güncelleyince eski değer profil geçmişinde kalır; React Query optimistic update ile dose tickleme anında dolu daire gösterir.

---

### G-17
- **Görev Adı:** Local Notifications + Native İzinler
- **Atanan:** Nehir Bozbey *(yapılandırma)* + Abdussamed Ateş *(entegrasyon)*
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `@notifee/react-native` aktif reçeteler için `RepeatFrequency.DAILY` ile `TimestampTrigger` kurar. `src/notifications/scheduler.ts` içindeki `syncMedicationReminders(prescriptions)` fonksiyonu artık-olmayan reçetelerin bildirimlerini siler.

  iOS Info.plist:
  - `NSMicrophoneUsageDescription`, `NSSpeechRecognitionUsageDescription`, `NSSiriUsageDescription`
  - `NSUserActivityTypes` (com.limitlesscare.medication.taken / symptom.log)
  - `UIBackgroundModes` (fetch / remote-notification)

  Android Manifest:
  - `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`
  - `<queries>` ile `RecognitionService` intent

- **Kabul Kriteri:** İlk reçete eklendiğinde 08:00'de ekran kilidinde bildirim çıkar; cihaz reboot sonrası bildirimler kalıcıdır; iOS Settings → Bildirimler → LimitlessCare girişi görünür.

---

### G-18
- **Görev Adı:** Reports Mobile Ekranı + Severity Chart + Bildirim Merkezi
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `ReportsScreen` (mobile, doktor için): hasta×hastalık karelerinde "PDF Oluştur / Excel Oluştur" butonları; üretilen rapor altta listede "İndir" linki — `Linking.openURL` ile imzalı `?t=<token>` URL açar. **`SeverityChart`** komponentinin kendisi de bu fazda yazılır (custom React Native View bar grafiği — kütüphane bağımlılığı yok, screen reader'a sözel özet verir: "Baş ağrısı: hafif 3, orta 5, ağır 1").
- **Kabul Kriteri:** Tarayıcı PDF/Excel'i token query ile açar (401 yok); `SeverityChart` boş veride uygun mesaj gösterir; tüm bar'lar relative max'e göre orantılı.

---

## 📌 Faz 5 — Test, Erişilebilirlik & Optimizasyon (Hafta 12–13)

### G-19
- **Görev Adı:** API Entegrasyon + Yük Testleri
- **Atanan:** Ahmet Efe
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `vitest` + `supertest` ile auth (4 endpoint), doctor (assignment + prescription + timeline), caregiver (today + dose check + symptom log + metrics), reports (generate + download) entegrasyon testleri yazılır. Test DB (`limitlesscare_test`) docker compose'a eklenir; `beforeEach` ile truncate. `k6` script'i 100 eşzamanlı caregiver Today + 50 doctor patients senaryosunu çalıştırır.
- **Kabul Kriteri:** Test coverage `≥ 70%`; `k6` raporu p95 < 500 ms; CI pipeline'da test job yeşil; PR'da coverage düşüşü Codecov uyarısı verir.

---

### G-20
- **Görev Adı:** Güvenlik Denetimi & KVKK Uyumluluk Raporu
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** OWASP Top 10 üzerinden manuel kontrol + `npm audit` + `docker scout cves`. Owner şifresi rotation prosedürü, JWT secret rotation, `pg_dump` ile zaman damgalı yedekler `s3:limitlesscare-backups/` altına. KVKK için `docs/kvkk.md`: e-posta ön atamada veri saklama, hasta talebi üzerine silme akışı, veri retansiyon süreleri.
- **Kabul Kriteri:** OWASP checklist tamamlandı; kritik/yüksek bulguların hepsi PR ile kapatıldı; KVKK belgesi repo kökünde; `npm audit` çıktısı 0 kritik.

---

### G-21
- **Görev Adı:** Mobile Erişilebilirlik (WCAG AA) + Sesli Komut + Siri Shortcuts
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** Tüm interaktif elemanlarda `accessibilityLabel` + `accessibilityHint` + `accessibilityRole` doğrulanır; checkbox/radio rolleri; `Heading` auto-focus + `accessibilityLiveRegion="polite"` ile hata duyurusu; renk kontrast 4.5:1 (Stark veya benzeri ile ölçülür); minimum 44×44pt dokunma alanı. `react-native-tts` ile semptom açıklamalarını sesli okuma; `@react-native-voice/voice` ile semptom note alanına Türkçe STT; iOS Siri Shortcuts: "ilacımı aldım" donate edilir.
- **Kabul Kriteri:** VoiceOver / TalkBack ile tüm akış tamamlanabilir; "Bugünün Görevleri" sayfası screen reader'a "2/3 alındı" diye okunur; STT ile "Yorgunluk hissediyorum" notu kaydedilebilir; Siri Settings → Shortcuts'ta donate edilen kısayol görünür.

---

## 📌 Faz 6 — Deployment & Lansman (Hafta 14)

### G-22
- **Görev Adı:** Production Docker Deployment + Yedekleme
- **Atanan:** Nehir Bozbey
- **Öncelik:** 🔴 Kritik
- **İş Tanımı:** `docker-compose.prod.yml` (postgres + backend + nginx + certbot + grafana). Postgres replica set yerine v1 için günlük `pg_dump` cron job → S3 (KMS şifreli). Backend image GHCR'dan `:latest` ile pull; `restart: unless-stopped`. Secret yönetimi `AWS Secrets Manager` veya en basit haliyle Hetzner panel env. CI'dan tetiklenen `deploy.yml` ile sunucuya SSH + docker compose pull + up.
- **Kabul Kriteri:** `https://limitlesscare.app` üretimde stabil; günlük yedek S3'e yükleniyor (son 30 gün retention); deploy 2 dakikadan kısa; rollback `docker compose down && pull <prev tag> && up` ile yapılabiliyor.

---

### G-23
- **Görev Adı:** API Dokümantasyonu (OpenAPI/Swagger) + Teknik Rapor
- **Atanan:** Ahmet Efe
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** `zod-to-openapi` ile route handler'lardaki Zod şemalarından OpenAPI 3.1 spec üretilir. `swagger-ui-express` ile `/docs` altında interaktif UI. README'ye stack şeması, kurulum adımları, env değişkenleri ve çevrimiçi deploy talimatı eklenir. `docs/teknik-rapor.md` (hoca sunumu) hazırlanır: mimari kararlar, KVKK, erişilebilirlik, ilaç uyum mantığı, e-posta ön atama, raporlama.
- **Kabul Kriteri:** Swagger UI tüm endpoint'leri ve request/response şemalarını gösterir; README'den sıfırdan kurulum yapılabiliyor; `docs/teknik-rapor.md` PDF'e çevrilebiliyor; ekip içi review onaylandı.

---

### G-24
- **Görev Adı:** iOS / Android Release Build + Smoke Test
- **Atanan:** Abdussamed Ateş
- **Öncelik:** 🟡 Yüksek
- **İş Tanımı:** Mobile `API_BASE_URL` production endpoint'e çevrilir. iOS: Xcode Archive → TestFlight build (Apple Developer hesabı gerekli). Android: `./gradlew :app:assembleRelease` ile imzalı APK. **14 adımlı smoke test senaryosu** (`docs/verification.md` zaten var) gerçek cihazda çalıştırılır. `notifee` background task'ları gerçek cihazda doğrulanır (test cihazında 08:00'i bekle).
- **Kabul Kriteri:** TestFlight build distributed; APK 5 farklı Android versiyonunda (12, 13, 14, 15, 16) hatasız yüklenip 14 adım test geçer; release notes hazır; `docs/verification.md` adımları ✅ olarak işaretlenmiş.

---

## 📊 Özet Takvim

| Hafta | Nehir (DevOps) | Ahmet Efe (Backend) | Abdussamed (Frontend) |
|-------|----------------|---------------------|------------------------|
| 1–2  | G-01 Docker, G-02 CI/CD              | G-03 Prisma şema + migration              | G-04 Mobile/Web iskelet                  |
| 3–4  | G-07 SSL/Nginx                        | G-05 Auth API · **G-06 KVKK ⭐**          | G-08 Welcome/Login/Register              |
| 5–6  | G-14 Monitoring                       | G-09 Catalog seed                          | G-12 Owner Web Admin                     |
| 7–8  | —                                     | G-10 Doctor API · G-11 Caregiver API       | G-13 Doctor Mobile Stack                 |
| 9–10 | G-17 Local Notif yapılandırma         | G-15 Rapor (PDF/Excel)                     | G-16 Caregiver Mobile · G-17 entegrasyon |
| 11   | —                                     | API polish & bug fix                       | G-18 Reports + SeverityChart             |
| 12–13| G-20 Güvenlik & KVKK                  | G-19 API Test (vitest + k6)                | G-21 WCAG + TTS/STT + Siri               |
| 14   | G-22 Production Deploy                | G-23 OpenAPI + Teknik Rapor                | G-24 TestFlight + APK + Smoke            |

---

## 🗃️ PostgreSQL Tablo İlişkileri (Prisma)

```
User (1) ─────── (1) DoctorProfile
User (1) ─────── (1) CaregiverProfile
CaregiverProfile (1) ─── (N) PatientMetric          (boy/kilo zaman serisi)
Disease (1) ─── (N) Symptom                         (kategorize edilmiş katalog)
PatientDisease (N) ─── (1) Disease
PatientDisease (N) ─── (1) User as doctor
PatientDisease (N) ─── (1) CaregiverProfile?        (e-posta ön atamada null)
PatientDisease (1) ─── (N) SymptomLog
PatientDisease (1) ─── (N) Prescription
Prescription (1) ─── (N) DoseEvent                  (lazy materialize)
PatientDisease (1) ─── (N) Report
```

## 🔑 Kritik Akışlar (Single Source of Truth)

1. **Doktor onayı:** `User(role=DOCTOR)` → `DoctorProfile.status=PENDING` → owner approve → `APPROVED`. Mobile'da PENDING ise yalnızca `PendingStack` görünür.
2. **E-posta ön atama:** Doktor e-posta + hastalık → `PatientDisease(caregiverEmail, status=PENDING_USER)` → caregiver kayıt olunca otomatik `ACTIVE`.
3. **İlaç uyum:** `Prescription.scheduleTimes × tarih` → `DoseEvent` (lazy upsert) → tikleme → delay ≤30dk = `TAKEN_ON_TIME`, sonrası `TAKEN_LATE`, 60dk üzeri PENDING = `MISSED`.
4. **Severity grafiği:** Backend timeline endpoint → mobile `SeverityChart` ile her semptom için MILD/MODERATE/SEVERE sayıları yan yana bar.
5. **Rapor indirme:** Doktor `POST /reports` → backend filesystem'e yazar → mobile `Linking.openURL(url + "?t=" + accessToken)` → backend query token ile auth.
