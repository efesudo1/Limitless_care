import { SeedMedication } from './types';

export const MEDICATIONS: SeedMedication[] = [
  // Diyabet
  { name: 'Metformin', defaultUnit: 'mg', description: 'Tip 2 diyabette ilk seçenek oral antidiyabetik (biguanid).' },
  { name: 'Glimepirid', defaultUnit: 'mg', description: 'Tip 2 diyabette pankreastan insülin salgısını artıran sülfonilüre.' },
  { name: 'İnsülin Glarjin', defaultUnit: 'IU', description: 'Uzun etkili bazal insülin analoğu.' },
  { name: 'İnsülin Aspart', defaultUnit: 'IU', description: 'Hızlı etkili öğün insülini.' },
  { name: 'Empagliflozin', defaultUnit: 'mg', description: 'SGLT2 inhibitörü, kardiyovasküler korumalı oral antidiyabetik.' },

  // Hipertansiyon / Kardiyovasküler
  { name: 'Lisinopril', defaultUnit: 'mg', description: 'ACE inhibitörü; hipertansiyon ve kalp yetmezliğinde.' },
  { name: 'Ramipril', defaultUnit: 'mg', description: 'ACE inhibitörü; hipertansiyon ve sekonder koruma.' },
  { name: 'Amlodipin', defaultUnit: 'mg', description: 'Kalsiyum kanal blokeri; hipertansiyon ve angina.' },
  { name: 'Valsartan', defaultUnit: 'mg', description: 'ARB; hipertansiyon ve kalp yetmezliği.' },
  { name: 'Bisoprolol', defaultUnit: 'mg', description: 'Kardiyo-selektif beta bloker.' },
  { name: 'Atorvastatin', defaultUnit: 'mg', description: 'HMG-CoA redüktaz inhibitörü; LDL düşürücü.' },
  { name: 'Aspirin', defaultUnit: 'mg', description: 'Düşük doz antitrombositer; sekonder koruma.' },
  { name: 'Klopidogrel', defaultUnit: 'mg', description: 'P2Y12 antitrombositer.' },
  { name: 'Furosemid', defaultUnit: 'mg', description: 'Loop diüretik; volüm yüklenmesi.' },
  { name: 'Spironolakton', defaultUnit: 'mg', description: 'Aldosteron antagonisti diüretik.' },
  { name: 'Hidroklorotiyazid', defaultUnit: 'mg', description: 'Tiazid diüretik.' },

  // Solunum
  { name: 'Salbutamol', defaultUnit: 'mcg', description: 'Kısa etkili beta-2 agonist inhaler (rahatlatıcı).' },
  { name: 'Budesonid', defaultUnit: 'mcg', description: 'İnhale kortikosteroid; astım/KOAH koruyucu.' },
  { name: 'Formoterol', defaultUnit: 'mcg', description: 'Uzun etkili beta-2 agonist.' },
  { name: 'Tiotropium', defaultUnit: 'mcg', description: 'Uzun etkili antikolinerjik (KOAH).' },
  { name: 'Montelukast', defaultUnit: 'mg', description: 'Lökotrien reseptör antagonisti.' },

  // Psikiyatri / Nöroloji
  { name: 'Sertralin', defaultUnit: 'mg', description: 'SSRI; depresyon ve anksiyete.' },
  { name: 'Essitalopram', defaultUnit: 'mg', description: 'SSRI; depresyon ve anksiyete.' },
  { name: 'Fluoksetin', defaultUnit: 'mg', description: 'SSRI; depresyon, OKB, bulimia.' },
  { name: 'Venlafaksin', defaultUnit: 'mg', description: 'SNRI; depresyon ve yaygın anksiyete.' },
  { name: 'Risperidon', defaultUnit: 'mg', description: 'Atipik antipsikotik.' },
  { name: 'Aripiprazol', defaultUnit: 'mg', description: 'Atipik antipsikotik.' },
  { name: 'Olanzapin', defaultUnit: 'mg', description: 'Atipik antipsikotik.' },
  { name: 'Ketiapin', defaultUnit: 'mg', description: 'Atipik antipsikotik; bipolar idame.' },
  { name: 'Lityum Karbonat', defaultUnit: 'mg', description: 'Bipolar bozuklukta duygu durum dengeleyici.' },
  { name: 'Valproik Asit', defaultUnit: 'mg', description: 'Antiepileptik ve duygu durum dengeleyici.' },
  { name: 'Karbamazepin', defaultUnit: 'mg', description: 'Antiepileptik.' },
  { name: 'Levetirasetam', defaultUnit: 'mg', description: 'Geniş spektrumlu antiepileptik.' },
  { name: 'Lamotrijin', defaultUnit: 'mg', description: 'Antiepileptik ve bipolar idame.' },
  { name: 'Metilfenidat', defaultUnit: 'mg', description: 'Stimülan; DEHB tedavisi.' },
  { name: 'Atomoksetin', defaultUnit: 'mg', description: 'Non-stimülan DEHB tedavisi.' },
  { name: 'Levodopa/Karbidopa', defaultUnit: 'mg', description: 'Parkinson hastalığında dopaminerjik tedavi.' },
  { name: 'Donepezil', defaultUnit: 'mg', description: 'Alzheimer için kolinesteraz inhibitörü.' },
  { name: 'Memantin', defaultUnit: 'mg', description: 'NMDA reseptör antagonisti; orta-ileri Alzheimer.' },
  { name: 'Klonazepam', defaultUnit: 'mg', description: 'Benzodiyazepin; epilepsi/anksiyete.' },

  // Romatoloji / Ağrı
  { name: 'Metotreksat', defaultUnit: 'mg', description: 'Hastalık modifiye edici antiromatizmal (DMARD).' },
  { name: 'Hidroksiklorokin', defaultUnit: 'mg', description: 'SLE ve romatoid artritte kullanılır.' },
  { name: 'Prednizolon', defaultUnit: 'mg', description: 'Sistemik kortikosteroid.' },
  { name: 'Pregabalin', defaultUnit: 'mg', description: 'Nöropatik ağrı ve fibromiyalji.' },
  { name: 'Duloksetin', defaultUnit: 'mg', description: 'SNRI; fibromiyalji ve depresyon.' },

  // Endokrin / Diğer
  { name: 'Levotiroksin', defaultUnit: 'mcg', description: 'Hipotiroidizm tedavisi.' },
  { name: 'D Vitamini (Kolekalsiferol)', defaultUnit: 'IU', description: 'D vitamini eksikliği takviyesi.' },
  { name: 'B12 Vitamini', defaultUnit: 'mcg', description: 'B12 eksikliği takviyesi.' },
  { name: 'Folik Asit', defaultUnit: 'mg', description: 'Folat eksikliği ve metotreksat ile birlikte.' },
  { name: 'Kalsiyum Karbonat', defaultUnit: 'mg', description: 'Kalsiyum takviyesi.' },
  { name: 'Demir Sülfat', defaultUnit: 'mg', description: 'Demir eksikliği anemisi.' },
];
