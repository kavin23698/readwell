// Reading stats computed from local reading_sessions (works offline).
// A day counts as "read" when that day's total reaches the daily goal (minutes or pages).
import { db, useLiveQuery } from '@/db';
import type { ProfileRow, SessionRow } from '@/db/schema';
import { useProfile } from '@/features/profile/ProfileProvider';
import { addDays, localDate } from '@/lib/dates';

export const JOURNEY_DAYS = 254;

export type DayTotal = { date: string; seconds: number; pages: number; sessions: number };

export function dayAmount(t: Pick<DayTotal, 'seconds' | 'pages'>, goalType: ProfileRow['goal_type']): number {
  return goalType === 'pages' ? t.pages : t.seconds / 60;
}

/** Percentage of the daily goal reached (uncapped). */
export function ratio(t: Pick<DayTotal, 'seconds' | 'pages'>, p: Pick<ProfileRow, 'goal_type' | 'daily_goal'>): number {
  return p.daily_goal > 0 ? (dayAmount(t, p.goal_type) / p.daily_goal) * 100 : 0;
}

async function dayTotals(): Promise<Map<string, DayTotal>> {
  const rows = await db.getAllAsync<DayTotal>(
    `SELECT local_date AS date, SUM(seconds) AS seconds, SUM(pages) AS pages, COUNT(*) AS sessions
     FROM reading_sessions WHERE deleted_at IS NULL GROUP BY local_date`,
  );
  return new Map(rows.map((r) => [r.date, r]));
}

export type DailyStats = {
  today: DayTotal;
  todayPct: number;
  todayMet: boolean;
  /** Minutes (or pages) still needed today. */
  remaining: number;
  currentStreak: number;
  longestStreak: number;
  /** Days the goal was met, all time (the habit counter). */
  daysMet: number;
  /** "Day N of 254": met days, plus today while it's in progress. */
  journeyDay: number;
  last7: { date: string; pct: number }[];
  /** True when there is no reading data at all yet. */
  empty: boolean;
};

export function computeStats(totals: Map<string, DayTotal>, p: Pick<ProfileRow, 'goal_type' | 'daily_goal'>, now = new Date()): DailyStats {
  const todayKey = localDate(now);
  const zero = (date: string): DayTotal => ({ date, seconds: 0, pages: 0, sessions: 0 });
  const today = totals.get(todayKey) ?? zero(todayKey);
  const met = (d: string) => {
    const t = totals.get(d);
    return !!t && ratio(t, p) >= 100;
  };

  const todayPct = ratio(today, p);
  const todayMet = todayPct >= 100;

  // Current streak: consecutive met days ending today, or ending yesterday while today is in progress.
  let currentStreak = 0;
  let cursor = todayMet ? todayKey : addDays(todayKey, -1);
  while (met(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const metDays = [...totals.keys()].filter(met).sort();
  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of metDays) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    prev = d;
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(todayKey, i - 6);
    const t = totals.get(date);
    return { date, pct: t ? Math.round(ratio(t, p)) : 0 };
  });

  const daysMet = metDays.length;
  const done = dayAmount(today, p.goal_type);
  return {
    today,
    todayPct,
    todayMet,
    remaining: Math.max(0, Math.ceil(p.daily_goal - done)),
    currentStreak,
    longestStreak,
    daysMet,
    journeyDay: Math.min(JOURNEY_DAYS, Math.max(1, daysMet + (todayMet ? 0 : 1))),
    last7,
    empty: totals.size === 0,
  };
}

/** Live daily stats for the signed-in user. */
export function useDailyStats(): DailyStats | undefined {
  const { profile } = useProfile();
  const goal = profile ? { goal_type: profile.goal_type, daily_goal: profile.daily_goal } : null;
  return useLiveQuery(
    ['reading_sessions', 'profiles'],
    async () => (goal ? computeStats(await dayTotals(), goal) : undefined),
    [goal?.goal_type, goal?.daily_goal],
  ) ?? undefined;
}

/** Today's sessions with their book titles (Daily performance screen). */
export function useTodaySessions() {
  return useLiveQuery(['reading_sessions', 'books'], () =>
    db.getAllAsync<SessionRow & { title: string | null; author: string | null; cover_seed: number | null; local_cover: string | null }>(
      `SELECT s.*, b.title, b.author, b.cover_seed, b.local_cover FROM reading_sessions s
       LEFT JOIN books b ON b.id = s.book_id
       WHERE s.deleted_at IS NULL AND s.local_date = ? ORDER BY s.started_at`,
      [localDate()],
    ),
  );
}
