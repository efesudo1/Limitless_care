# End-to-End Manuel Test Senaryosu

Aşağıdaki 14 adım v1'in tüm kritik akışlarını kapsar. Her adımda beklenen sonucu yazılı olarak doğrulayın.

## Önkoşul: 3 servis ayakta

```bash
# Terminal 1 — DB
docker compose up -d postgres

# Terminal 2 — backend
cd backend
cp ../.env.example ../.env       # ilk kurulumda
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev                       # http://localhost:4000

# Terminal 3 — admin web
cd admin-web
npm install
npm run dev                       # http://localhost:5173

# Terminal 4 — mobile (her platformda farklı)
cd mobile
npm install
# iOS:
cd ios && bundle install && bundle exec pod install && cd ..
npm run ios
# Android:
npm run android
```

## Senaryo

1. **DB sağlık**: `docker compose ps` çıktısında `limitlesscare-db` healthy.
2. **Seed kontrolü**: `npx prisma studio` (backend dizininde) `Disease` tablosunda 46 hastalık, `Symptom`'da ~460+ satır, `Medication`'da ~50, `User`'da owner kaydı görmelisiniz.
3. **Owner girişi**: `http://localhost:5173` adresine `owner@limitlesscare.local` / `Owner!2024Dev` ile girin. Sol menüde "Doktor Onayları", "Hastalıklar", "İlaçlar" görünür.
4. **Doktor kayıt** (mobile): Welcome → "Doktor Olarak Kayıt Ol" → form doldur → "Kayıt alındı, owner onayı bekleniyor" alert. Login → "Onay Bekleniyor" ekranı.
5. **Owner doktoru onaylar**: `Doktor Onayları` sayfasında PENDING listede yeni kayıt görünür → "Onayla" butonu. Mobile'da "Durumu Yenile" butonuna basınca DoctorStack açılır.
6. **Caregiver kayıt** (mobile, ikinci cihaz/emülatör veya logout sonra): Welcome → "Hasta Takip Olarak Kayıt Ol" → ad/email/şifre + cinsiyet/doğum tarihi/boy/kilo. Caregiver Today ekranı boş açılır.
7. **Doktor hastalık atar**: Doctor Tabs → Hastalar → arama yok → AssignDisease → caregiver e-postası + "Hipertansiyon" seç → "Hastalığı Ata". Caregiver mobile'da Today'i yenileyince "Atanan Hastalıklar"da kart görünür.
8. **Doktor reçete ekler**: Doctor → PatientList → karta tıkla → PatientDetail → "Yeni Reçete Ekle" → Lisinopril, doz 10 mg, saatler 08:00 ve 20:00 → "Reçeteyi Kaydet". Caregiver Today'de iki dose görünür, ilerleme barı 0/2.
9. **Caregiver dose tikler**: Today'de bir dozu tıklayın. Daire dolar, ilerleme 1/2'ye çıkar, screen reader "alındı" der. `@notifee/react-native` günlük tekrarlı yerel bildirim 08:00'de ekrana düşer.
10. **Caregiver semptom işaretler**: DiseaseDetail → "Baş ağrısı" altında Orta seç → "Semptomları Kaydet". Backend `/me/symptom-logs`'a POST eder; doctor PatientDetail timeline'ında görünür.
11. **E-posta ön-atama testi**: Doktor `yeni@test.com` (kayıtlı olmayan) adresine bir hastalık atar → owner panelden veya Prisma Studio'dan `PatientDisease` tablosunda `caregiverId=null`, `status=PENDING_USER` görmelisiniz. Mobile'da o e-posta ile yeni caregiver kayıt olur. Today açılınca hastalık otomatik ACTIVE listede görünür.
12. **Doktor rapor üretir**: Reports tab → ilgili hasta kartı altında "PDF Oluştur". Backend `uploads/reports/` altına dosya yazar, listede beliren rapor "PDF İndir" ile indirilebilir. PDF içinde semptom severity dağılımı + ilaç uyum yüzdesi yer alır. Aynı testi "Excel Oluştur" ile de yapın.
13. **Caregiver boy/kilo günceller**: Profile tab → "Yeni Ölçüm Gönder" → 175/72 → Kaydet. Profile'da yeni ölçüm satırı + tarih, eski ölçüm "önceki" notuyla görünür.
14. **Doctor custom hastalık/semptom ekler**: Doctor tabs → Profil → "Hastalık & Semptom Yönetimi" → yeni hastalık ekle (örn. "Migren — kronik" özel) ya da var olan hastalığa "Geceleri ense ağrısı" gibi yeni semptom ekle. Caregiver disease detayında veya doktor AssignDisease ekranında yeni hastalık görünür.

## Erişilebilirlik kontrolleri (mobile)

- Tüm ekranlarda VoiceOver (iOS) / TalkBack (Android) ile başlığa otomatik odak gelir.
- Pressable, Button, TextInput'larda `accessibilityLabel` ve `accessibilityHint` mevcut.
- İlaç tikleme rolleri `checkbox`, semptom şiddeti seçimi `radio`.
- Hata mesajları `accessibilityLiveRegion="polite"` ile screen reader tarafından duyurulur.
- Renk kontrastları WCAG AA: arka plan + metin, primary buton + metin, semptom şiddet rozetleri.
- Dokunma alanları minimum 44×44pt.
- Sesli okuma için `src/voice/index.ts` `speak(text)` fonksiyonu hazır; istenirse semptom açıklamaları sesli okutulabilir.
- Sesli giriş için `startVoiceInput(callback)` fonksiyonu Türkçe (tr-TR) STT hazır.
- iOS Siri Shortcuts: `donateMedicationTakenShortcut` çağrısı yapıldığında Ayarlar → Siri & Search'te "X aldım" kısayolu görünür.
