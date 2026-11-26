// Notification permission (Android 13+ POST_NOTIFICATIONS). Android needs a channel to exist before
// the permission prompt can be shown.
import * as Notifications from 'expo-notifications';

export const CHANNEL_ID = 'reminders';

export async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Reading reminders',
    description: 'Your daily reminder, streak nudges and challenge updates',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

// Exact alarms (Android 12+ "Alarms & reminders"). When allowed, expo-notifications schedules
// reminders with exact alarms; otherwise Android may deliver them up to about an hour late.
// Below Android 12 this is always granted.

export async function exactAlarmsAllowed(): Promise<boolean> {
  try {
    return (await Notifications.getExactAlarmPermissionsAsync()).granted;
  } catch {
    return true; // platform without the concept
  }
}

