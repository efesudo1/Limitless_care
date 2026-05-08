import notifee, { EventType, TriggerType, TimestampTrigger } from '@notifee/react-native';
import { caregiverApi } from '../api/endpoints';

export async function registerNotificationCategories() {
  // iOS: notification action button'ları için kategori tanımı
  try {
    await notifee.setNotificationCategories([
      {
        id: 'medication',
        actions: [
          { id: 'mark-taken', title: 'Aldım' },
          { id: 'snooze-15', title: '15 dk ertele' },
        ],
      },
    ]);
  } catch {
    // platform desteklemiyorsa sessiz geç
  }
}

async function snoozeNotification(notification: any) {
  if (!notification?.id) return;
  const ts = Date.now() + 15 * 60 * 1000;
  const trigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: ts };
  await notifee.createTriggerNotification(
    {
      ...notification,
      id: `${notification.id}-snz-${ts}`,
    },
    trigger
  );
}

export function registerBackgroundNotificationHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.ACTION_PRESS) return;
    const actionId = detail.pressAction?.id;
    const data = detail.notification?.data as { kind?: string; prescriptionId?: string } | undefined;
    if (data?.kind !== 'medication') return;

    if (actionId === 'mark-taken') {
      // Backend zaten en yakın PENDING dose'ı tespit edemediğinden,
      // burada doseEventId yok; getToday'den son PENDING'i bulup check etmeyi
      // istemcide yapmıyoruz (background'ta API çağrısı gecikmeli olabilir).
      // Notification'ı dismiss edip uygulama açıldığında kullanıcı tikleyecek.
      try {
        const today = await caregiverApi.today();
        const pending: any = (today ?? [])
          .flatMap((d: any) =>
            d.prescriptions
              .filter((p: any) => p.id === data.prescriptionId)
              .flatMap((p: any) => p.doses)
          )
          .find((dose: any) => dose.status === 'PENDING');
        if (pending) await caregiverApi.checkDose(pending.id);
      } catch {
        // sessiz: arka plan API başarısız olabilir, kullanıcı app açtığında tikleyecek
      }
    } else if (actionId === 'snooze-15') {
      await snoozeNotification(detail.notification);
    }
  });
}
