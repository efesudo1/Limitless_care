import { runAllPredictiveJobs } from './predictive.service';

const ONE_HOUR_MS = 60 * 60 * 1000;

let interval: ReturnType<typeof setInterval> | null = null;

export function startPredictiveScheduler() {
  if (interval) return;
  // İlk çalıştırma: server start sonrası 30 saniye bekle (DB bağlantısı stabilize olsun)
  setTimeout(() => {
    runAllPredictiveJobs().catch((e) => console.error('[predictive] run failed:', e));
  }, 30_000);
  // Her saat tekrarla — dedupeKey günlük bazda olduğu için aynı uyarı tekrarlanmaz
  interval = setInterval(() => {
    runAllPredictiveJobs().catch((e) => console.error('[predictive] run failed:', e));
  }, ONE_HOUR_MS);
}

export function stopPredictiveScheduler() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
