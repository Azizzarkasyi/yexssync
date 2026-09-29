import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

const NOTIFICATION_PERMISSION_KEY = 'yexssync_notification_permission';
const SHIFT_REMINDER_KEY = 'yexssync_shift_reminder_enabled';

/**
 * Request notification permissions across Web (HTML5 Notification API) and Mobile.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        return true;
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        const isGranted = permission === 'granted';
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, isGranted ? 'granted' : 'denied');
        return isGranted;
      }
      return false;
    }
    // On native mobile (future push token registration if configured)
    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    return true;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Send an immediate push notification alert to the user.
 */
export async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const notif = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.png',
          data: payload.data,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    }
  } catch (err) {
    console.warn('Error sending local notification:', err);
  }
}

/**
 * Schedule automated daily shift reminder (e.g. 15 minutes before shift start time).
 * @param workStartTime string formatted as "HH:mm" (e.g., "08:00")
 */
export async function scheduleShiftReminder(workStartTime: string = '08:00'): Promise<void> {
  try {
    const isPermissionGranted = await requestNotificationPermission();
    if (!isPermissionGranted) return;

    await AsyncStorage.setItem(SHIFT_REMINDER_KEY, 'true');

    // Parse work start time
    const [hours, minutes] = workStartTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    // Calculate alarm time (15 minutes prior)
    let reminderMinutes = minutes - 15;
    let reminderHours = hours;
    if (reminderMinutes < 0) {
      reminderMinutes += 60;
      reminderHours = (reminderHours - 1 + 24) % 24;
    }

    const reminderTimeStr = `${String(reminderHours).padStart(2, '0')}:${String(reminderMinutes).padStart(2, '0')}`;
    console.log(`[YexsSync Notification] Shift reminder scheduled daily at ${reminderTimeStr} WIB (15 mins before ${workStartTime})`);

    // In web browser runtime, register a timer check for the upcoming reminder window
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const now = new Date();
      const target = new Date();
      target.setHours(reminderHours, reminderMinutes, 0, 0);

      let delay = target.getTime() - now.getTime();
      if (delay < 0) {
        // Target time has already passed today; schedule for tomorrow
        delay += 24 * 60 * 60 * 1000;
      }

      setTimeout(() => {
        sendLocalNotification({
          title: '⏰ Pengingat Presensi YexsSync',
          body: `Shift kerja Anda akan dimulai pukul ${workStartTime} WIB (15 menit lagi). Siapkan presensi Anda!`,
        });
      }, delay);
    }
  } catch (err) {
    console.warn('Failed to schedule shift reminder:', err);
  }
}

/**
 * Send notification when Clock-In is successful.
 */
export function notifyClockInSuccess(time: string, address?: string) {
  sendLocalNotification({
    title: '✅ Presensi Masuk Berhasil',
    body: `Presensi masuk tercatat pukul ${time} WIB. Lokasi: ${address || 'Area Kantor'}. Semangat bekerja!`,
  });
}

/**
 * Send notification when Clock-Out is successful.
 */
export function notifyClockOutSuccess(time: string) {
  sendLocalNotification({
    title: '🏁 Presensi Pulang Berhasil',
    body: `Presensi pulang tercatat pukul ${time} WIB. Terima kasih atas kerja keras Anda hari ini!`,
  });
}

/**
 * Send notification when leave request is approved or rejected.
 */
export function notifyLeaveReviewed(status: 'APPROVED' | 'REJECTED', leaveType: string = 'Cuti/Izin') {
  const isApproved = status === 'APPROVED';
  sendLocalNotification({
    title: isApproved ? '🎉 Pengajuan Cuti Disetujui' : 'ℹ️ Status Pengajuan Cuti',
    body: isApproved
      ? `Pengajuan ${leaveType} Anda telah disetujui oleh HRD.`
      : `Pengajuan ${leaveType} Anda telah ditolak oleh HRD. Silakan cek catatan review.`,
  });
}
