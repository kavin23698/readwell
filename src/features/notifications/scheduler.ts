// Local scheduled notifications (no push server):
//  a) daily reading reminder at the chosen time
//  b) 8 pm streak-at-risk nudge on days the goal isn't met yet
//  c) heads-up 2 days before an active challenge ends while it's under 75%
// Everything is rescheduled from current data whenever it changes.
import * as Notifications from 'expo-notifications';
import type { ProfileRow } from '@/db/schema';
import { addDays, localDate, parseLocalDate } from '@/lib/dates';
import { CHANNEL_ID, ensureChannel, notificationsAllowed } from './permissions';

export const STREAK_HOUR = 20; // 8 pm
const STREAK_DAYS_AHEAD = 7;
const CHALLENGE_HOUR = 18;

export type ScheduleInput = {
  profile: ProfileRow;
  todayMet: boolean;
  currentStreak: number;
  lastBook: { id: string; title: string } | null;
  challenges: { id: string; title: string; ends_on: string; pct: number; status: string }[];
};

function at(dateStr: string, hour: number, minute = 0) {
  const d = parseLocalDate(dateStr);
  d.setHours(hour, minute, 0, 0);
  return d;
}

let lastKey = '';

export async function rescheduleAll(input: ScheduleInput | null) {
  // Skip if nothing relevant changed (this runs often).
  const key = JSON.stringify(input && { ...input, profile: pick(input.profile), day: localDate() });
  if (key === lastKey) return;
  lastKey = key;

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!input || !(await notificationsAllowed())) return;
  await ensureChannel();
  const { profile: p } = input;
  const now = Date.now();
  const unit = p.goal_type === 'pages' ? 'pages' : 'minutes';

  // a) Daily reminder.
  if (p.notif_daily) {
    const [h, m] = p.reminder_time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to read',
        body: input.lastBook
          ? `Your ${p.daily_goal} ${unit} are waiting — continue ${input.lastBook.title}`
          : `Your ${p.daily_goal} ${unit} are waiting — open a book in Readwell`,
        data: { url: input.lastBook ? `/reader/${input.lastBook.id}` : '/home' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m, channelId: CHANNEL_ID },
    });
  }

  // b) Streak at risk at 8 pm, only on days the goal isn't met (today is skipped once met).
  if (p.notif_streak) {
    for (let i = 0; i < STREAK_DAYS_AHEAD; i++) {
      const day = addDays(localDate(), i);
      if (i === 0 && input.todayMet) continue;
      const when = at(day, STREAK_HOUR);
      if (when.getTime() <= now) continue;
      const streak = i === 0 ? input.currentStreak : 0;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: streak > 1 ? `Your ${streak}-day streak is at risk` : "Today's reading isn't done yet",
          body: `A few ${unit} before midnight keeps your habit growing.`,
          data: { url: input.lastBook ? `/reader/${input.lastBook.id}` : '/home' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
      });
    }
  }

  // c) Challenge ends in 2 days and is under 75%.
  if (p.notif_challenge) {
    for (const c of input.challenges) {
      if (c.status !== 'active' || c.pct >= 75) continue;
      const when = at(addDays(c.ends_on, -2), CHALLENGE_HOUR);
      if (when.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '2 days left on your challenge',
          body: `“${c.title}” is at ${Math.round(c.pct)}%. A little reading each day gets you there.`,
          data: { url: `/challenge/${c.id}` },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when, channelId: CHANNEL_ID },
      });
    }
  }
}

function pick(p: ProfileRow) {
  return [p.goal_type, p.daily_goal, p.reminder_time, p.notif_daily, p.notif_streak, p.notif_challenge];
}

/** Forces the next rescheduleAll to run (e.g. after the permission changes). */
export function invalidateSchedule() {
  lastKey = '';
}
