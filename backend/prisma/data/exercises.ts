export type SeedExercise = {
  name: string;
  description: string;
  durationMin: number;
  videoUrl?: string;
};

export const EXERCISES: SeedExercise[] = [
  {
    name: 'Pasif Diz Bükme (ROM)',
    description:
      'Hasta sırtüstü uzanırken bakım veren elini hastanın dizinin altına ve topuğuna koyarak dizi yavaşça karına doğru büker. 10 tekrar.',
    durationMin: 5,
  },
  {
    name: 'Aktif Bilek Çevirme',
    description:
      'Otururken her iki ayak bileğini saat yönünde 10, ters yönde 10 kez çevirin. Şişlik ve dolaşım için.',
    durationMin: 5,
  },
  {
    name: 'İzometrik Quadriceps Sıkma',
    description:
      'Sırtüstü uzanırken bacak düz, diz arkasındaki yastığı yere doğru bastırarak quadriceps kasını 5 saniye sıkın, gevşetin. 10 tekrar.',
    durationMin: 7,
  },
  {
    name: 'Köprü Kurma',
    description:
      'Sırtüstü, dizler bükülü, ayaklar yerde. Kalçayı yavaşça yukarı kaldırıp 5 saniye tutun, indirin. 10 tekrar.',
    durationMin: 8,
  },
  {
    name: 'Oturarak Diz Uzatma',
    description:
      'Sandalyede otururken bir bacağı düz olarak yukarıya kaldırın, 5 saniye tutun, indirin. Her bacakla 10 tekrar.',
    durationMin: 6,
  },
  {
    name: 'Omuz Çevirme',
    description:
      'Otururken veya ayakta omuzları öne doğru 10, geriye doğru 10 kez büyük daireler çizerek çevirin.',
    durationMin: 4,
  },
  {
    name: 'Kavrama Kuvveti',
    description:
      'Yumuşak topu (veya katlanmış havluyu) sıkıp 5 saniye tutun, gevşetin. Her elle 15 tekrar. El kaslarını güçlendirir.',
    durationMin: 5,
  },
  {
    name: 'Boyun Esnetme',
    description:
      'Başı yavaşça sağ omuza eğin 5 sn tutun, sola eğin 5 sn tutun, öne eğin 5 sn tutun. Her yön 5 tekrar. Spazm sonrası rahatlatır.',
    durationMin: 5,
  },
  {
    name: 'Tek Ayak Üzerinde Denge',
    description:
      'Bir tutamağa hafifçe destek alarak tek ayak üzerinde 10 saniye durun. Diğer ayağa geçin. Her bacak 5 tekrar.',
    durationMin: 6,
  },
  {
    name: 'Topuk Yükseltme',
    description:
      'Ayakta, parmak uçlarında yükselip 2 sn tutun, indirin. 15 tekrar. Baldır kaslarını güçlendirir, dolaşımı artırır.',
    durationMin: 4,
  },
  {
    name: 'Oturup-Kalkma',
    description:
      'Sandalyeden destek almadan kalkıp tekrar oturun. 10 tekrar. Bacak güçlenmesi için en etkili egzersizlerden.',
    durationMin: 8,
  },
  {
    name: 'Yürüme (Yerinde Adım)',
    description:
      'Yerinde 1-2 dakika dizleri yüksek kaldırarak yürüyün. Sonra 1 dakika dinlenin. 3 set tekrarlayın.',
    durationMin: 10,
  },
];
