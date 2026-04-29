import { SeedDisease } from './types';

export const SENSORY_DISEASES: SeedDisease[] = [
  {
    name: 'Görme Yetersizliği',
    category: 'SENSORY',
    description: 'Düşük görme veya total görme kaybı ile günlük yaşam aktivitelerini etkileyen durum.',
    iconKey: 'visual-impairment',
    symptoms: [
      { name: 'Bulanık görme', description: 'Net olmayan, puslu görüntü algısı.' },
      { name: 'Görme alanı kısıtlılığı', description: 'Tüneli andıran, kenarları görmeyen alan.' },
      { name: 'Renk algısında zorluk', description: 'Renkleri ayırt edememe.' },
      { name: 'Karanlığa adaptasyon güçlüğü', description: 'Loş ortamda görme kaybı (gece körlüğü).' },
      { name: 'Fotofobi', description: 'Parlak ışıkta gözlerde rahatsızlık.' },
      { name: 'Çift görme', description: 'Diplopi yaşama.' },
      { name: 'Yüz tanıma güçlüğü', description: 'Tanıdıklarını uzaktan ayırt edememe.' },
      { name: 'Yazıyı okumada güçlük', description: 'Küçük puntoları okuyamama.' },
      { name: 'Yön bulma zorluğu', description: 'Tanıdık ortamlarda hareket etmekte güçlük.' },
      { name: 'Düşme/çarpma sıklığı', description: 'Çevredeki engelleri görememeye bağlı kazalar.' },
    ],
  },
  {
    name: 'İşitme Yetersizliği',
    category: 'SENSORY',
    description: 'Hafiften ileri dereceye değişen işitme kaybı; iletişim ve sosyal yaşamı etkiler.',
    iconKey: 'hearing-impairment',
    symptoms: [
      { name: 'Konuşmaları net duyamama', description: 'Söylenenleri eksik anlama.' },
      { name: 'Yüksek televizyon ihtiyacı', description: 'TV/radyo sesini sürekli açma.' },
      { name: 'Yüz yüze konuşma talebi', description: 'Dudak okumaya bağımlılık.' },
      { name: 'Tekrar etme isteği', description: 'Karşıdakinden söylediğini yinelemesini isteme.' },
      { name: 'Telefon konuşmasında güçlük', description: 'Telefonda konuşmayı anlayamama.' },
      { name: 'Tinnitus', description: 'Sürekli kulak çınlaması.' },
      { name: 'Kalabalıkta anlama güçlüğü', description: 'Gürültülü ortamda konuşmayı ayırt edememe.' },
      { name: 'Sesin yönünü bulamama', description: 'Ses kaynağının yerini saptayamama.' },
      { name: 'Kısılmış ses algısı', description: 'Konuşmaların boğuk gelmesi.' },
      { name: 'Sosyal kaçınma', description: 'İletişim güçlüğüne bağlı toplulukta yer almama.' },
    ],
  },
];
