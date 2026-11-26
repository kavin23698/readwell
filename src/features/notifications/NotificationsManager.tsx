// Keeps scheduled notifications in step with the user's data, and opens the right screen when a
// notification is tapped (the reader for the last book, or the challenge).
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { challengeTitle, useChallenges } from '@/features/challenges/challenges';
import { useContinueBook } from '@/features/home/useHomeData';
import { useProfile } from '@/features/profile/ProfileProvider';
import { useDailyStats } from '@/features/stats/stats';
import { invalidateSchedule, rescheduleAll } from './scheduler';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

function openFrom(response: Notifications.NotificationResponse | null) {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
}

export function NotificationsManager() {
  const { profile } = useProfile();
  const stats = useDailyStats();
  const book = useContinueBook();
  const challenges = useChallenges(profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tick, setTick] = useState(0);

  // Taps on notifications (also the one that cold-started the app).
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) {
        openFrom(r);
        Notifications.clearLastNotificationResponseAsync?.();
      }
    });
    const sub = Notifications.addNotificationResponseReceivedListener(openFrom);
    return () => sub.remove();
  }, []);

  // Reschedule (debounced) whenever the inputs change.
  useEffect(() => {
    if (!profile) {
      rescheduleAll(null).catch(() => {}); // signed out: nothing scheduled
      return;
    }
    if (!stats || book === undefined || !challenges) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      rescheduleAll({
        profile,
        todayMet: stats.todayMet,
        currentStreak: stats.currentStreak,
        lastBook: book ? { id: book.id, title: book.title } : null,
        challenges: challenges.map((c) => ({ id: c.id, title: challengeTitle(c), ends_on: c.ends_on, pct: c.progress.pct, status: c.status })),
      }).catch((e) => console.warn('[notifications]', e));
    }, 1500);
  }, [profile, stats, book, challenges, tick]);

  // Coming back to the app: the permission may have changed in system settings.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        invalidateSchedule();
        setTick((t) => t + 1);
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}
