import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';

type Prescription = {
  id: string;
  medicationName: string;
  doseAmount: number;
  doseUnit: string;
  scheduleTimes: string[];
};

const CHANNEL_ID = 'medications';

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'İlaç Hatırlatıcıları',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

function nextOccurrence(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() < Date.now()) next.setDate(next.getDate() + 1);
  return next;
}

/**
 * Aktif reçetelere göre günlük tekrarlı yerel bildirimleri kurar.
 * Her gün scheduleTimes[i] saatinde "X ilacı zamanı" hatırlatması atılır.
 * Erişilebilirlik: notification body screen reader tarafından yüksek sesle okunabilir.
 */
export async function syncMedicationReminders(prescriptions: Prescription[]) {
  await ensureChannel();
  const desiredIds = new Set<string>();

  for (const p of prescriptions) {
    for (const time of p.scheduleTimes) {
      const id = `med-${p.id}-${time}`;
      desiredIds.add(id);
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: nextOccurrence(time).getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
        alarmManager: { allowWhileIdle: true },
      };
      await notifee.createTriggerNotification(
        {
          id,
          title: 'İlaç zamanı',
          body: `${p.medicationName} ${p.doseAmount} ${p.doseUnit} - saat ${time}`,
          android: {
            channelId: CHANNEL_ID,
            pressAction: { id: 'default' },
            smallIcon: 'ic_launcher',
          },
          ios: {
            sound: 'default',
            critical: false,
          },
        },
        trigger
      );
    }
  }

  // Artık olmayan reçeteler için eski bildirimleri kaldır
  const existing = await notifee.getTriggerNotificationIds();
  const stale = existing.filter((id) => id.startsWith('med-') && !desiredIds.has(id));
  for (const id of stale) await notifee.cancelTriggerNotification(id);
}

export async function clearAllReminders() {
  const ids = await notifee.getTriggerNotificationIds();
  await Promise.all(ids.filter((i) => i.startsWith('med-')).map((i) => notifee.cancelTriggerNotification(i)));
}
