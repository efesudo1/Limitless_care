/**
 * Türkçe doğal dil severity önerisi.
 * "Hafif", "biraz" → MILD; "orta" → MODERATE; "şiddetli/çok ağır/dayanılmaz" → SEVERE.
 */

export type Severity = 'MILD' | 'MODERATE' | 'SEVERE';

const TOKENS: Array<{ severity: Severity; words: string[] }> = [
  {
    severity: 'SEVERE',
    words: ['şiddetli', 'siddetli', 'çok ağır', 'cok agir', 'çok kötü', 'cok kotu', 'dayanılmaz', 'dayanilmaz', 'aşırı', 'asiri'],
  },
  {
    severity: 'MODERATE',
    words: ['orta', 'orta seviye', 'biraz fazla', 'belirgin'],
  },
  {
    severity: 'MILD',
    words: ['hafif', 'biraz', 'az', 'düşük', 'dusuk', 'çok az', 'cok az'],
  },
];

export function parseSymptomSeverity(text: string): Severity | null {
  if (!text) return null;
  const lower = text.toLocaleLowerCase('tr');
  for (const group of TOKENS) {
    for (const w of group.words) {
      if (lower.includes(w)) return group.severity;
    }
  }
  return null;
}
