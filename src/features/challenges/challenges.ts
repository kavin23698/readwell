// Weekly / monthly challenges. Progress is computed from local reading data, so it updates
// automatically (and offline). Weeks run Monday–Sunday; months are calendar months (local time).
import Storage from 'expo-sqlite/kv-store';
import { all, db, newId, nowIso, patch, remove, save, useLiveQuery } from '@/db';
import type { ChallengeRow, ProfileRow } from '@/db/schema';
import { addDays, daysBetween, localDate, parseLocalDate } from '@/lib/dates';

export type Period = ChallengeRow['period'];
export type TargetType = ChallengeRow['target_type'];

export const targetTypes: { value: TargetType; label: string; unit: (n: number) => string; icon: 'library' | 'file-text' | 'clock-3' | 'calendar-check' }[] = [
  { value: 'books', label: 'Books finished', unit: (n) => (n === 1 ? 'book' : 'books'), icon: 'library' },
  { value: 'pages', label: 'Pages read', unit: (n) => (n === 1 ? 'page' : 'pages'), icon: 'file-text' },
  { value: 'minutes', label: 'Minutes read', unit: (n) => (n === 1 ? 'minute' : 'minutes'), icon: 'clock-3' },
  { value: 'goal_days', label: 'Goal days', unit: (n) => (n === 1 ? 'day' : 'days'), icon: 'calendar-check' },
];

export const defaultTargets: Record<Period, Record<TargetType, number>> = {
  week: { books: 1, pages: 150, minutes: 120, goal_days: 5 },
  month: { books: 2, pages: 600, minutes: 450, goal_days: 20 },
};

export const unitOf = (t: TargetType, n: number) => targetTypes.find((x) => x.value === t)!.unit(n);

/** "Read 150 pages this week", "Finish 2 books this month", "Meet your goal on 5 days this week". */
export function challengeTitle(c: Pick<ChallengeRow, 'period' | 'target_type' | 'target'>) {
  const when = c.period === 'week' ? 'this week' : 'this month';
  switch (c.target_type) {
    case 'books':
      return `Finish ${c.target} ${unitOf('books', c.target)} ${when}`;
    case 'pages':
      return `Read ${c.target} pages ${when}`;
    case 'minutes':
      return `Read ${c.target} minutes ${when}`;
    case 'goal_days':
      return `Meet your goal on ${c.target} ${unitOf('goal_days', c.target)} ${when}`;
  }
}

export function periodBounds(period: Period, today = localDate()): { starts_on: string; ends_on: string } {
  const d = parseLocalDate(today);
  if (period === 'week') {
    const monday = addDays(today, -((d.getDay() + 6) % 7));
    return { starts_on: monday, ends_on: addDays(monday, 6) };
  }
  const first = localDate(new Date(d.getFullYear(), d.getMonth(), 1, 12));
  const last = localDate(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
  return { starts_on: first, ends_on: last };
}

const fmtRange = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' });
const fmtDayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('en-GB', { month: 'long' });

/** "Mon 24 – Sun 30 Nov" or "November". */
export function rangeLabel(c: Pick<ChallengeRow, 'period' | 'starts_on' | 'ends_on'>) {
  const s = parseLocalDate(c.starts_on);
  const e = parseLocalDate(c.ends_on);
  if (c.period === 'month') return `${fmtMonth.format(s)} ${s.getFullYear()}`;
  return `${fmtRange.format(s)} – ${fmtRange.format(e)} ${new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(e)}`;
}
export const dayMonth = (s: string) => fmtDayMonth.format(parseLocalDate(s));

export function daysLeft(c: Pick<ChallengeRow, 'ends_on'>, today = localDate()) {
  return Math.max(0, daysBetween(today, c.ends_on) + 1);
}

// ------------------------------------------------------------------------------------------------
// Progress
// ------------------------------------------------------------------------------------------------
export type Progress = {
  value: number;
  pct: number;
  /** Per day (week) or per week (month) amounts for the breakdown chart. */
  breakdown: { label: string; value: number }[];
  /** Pages / minutes per book in the period. */
  byBook: { bookId: string; title: string; coverSeed: number; localCover: string | null; amount: number }[];
  daysRead: number;
  booksRead: number;
};

async function dayTotals(from: string, to: string) {
  return db.getAllAsync<{ date: string; seconds: number; pages: number }>(
    `SELECT local_date AS date, SUM(seconds) AS seconds, SUM(pages) AS pages FROM reading_sessions
     WHERE deleted_at IS NULL AND local_date BETWEEN ? AND ? GROUP BY local_date`,
    [from, to],
  );
}

export async function computeProgress(c: ChallengeRow, goal: Pick<ProfileRow, 'goal_type' | 'daily_goal'>): Promise<Progress> {
  const days = await dayTotals(c.starts_on, c.ends_on);
  const byDay = new Map(days.map((d) => [d.date, d]));
  const met = (d: { seconds: number; pages: number }) => (goal.goal_type === 'pages' ? d.pages : d.seconds / 60) >= goal.daily_goal;

  const finished = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL AND finished_at IS NOT NULL
     AND date(finished_at, 'localtime') BETWEEN ? AND ?`,
    [c.starts_on, c.ends_on],
  );

  let value = 0;
  if (c.target_type === 'pages') value = days.reduce((s, d) => s + d.pages, 0);
  else if (c.target_type === 'minutes') value = Math.floor(days.reduce((s, d) => s + d.seconds, 0) / 60);
  else if (c.target_type === 'goal_days') value = days.filter(met).length;
  else value = finished?.n ?? 0;

  const amountOf = (d?: { seconds: number; pages: number }) =>
    !d ? 0 : c.target_type === 'minutes' ? Math.round(d.seconds / 60) : c.target_type === 'goal_days' ? (met(d) ? 1 : 0) : d.pages;

  const breakdown: Progress['breakdown'] = [];
  if (c.period === 'week') {
    for (let i = 0; i < 7; i++) {
      const date = addDays(c.starts_on, i);
      breakdown.push({ label: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(parseLocalDate(date)), value: amountOf(byDay.get(date)) });
    }
  } else {
    const total = daysBetween(c.starts_on, c.ends_on) + 1;
    for (let w = 0; w * 7 < total; w++) {
      let v = 0;
      for (let i = w * 7; i < Math.min(total, w * 7 + 7); i++) v += amountOf(byDay.get(addDays(c.starts_on, i)));
      breakdown.push({ label: `W${w + 1}`, value: v });
    }
  }

  const byBook = await db.getAllAsync<{ bookId: string; title: string; coverSeed: number; localCover: string | null; amount: number }>(
    `SELECT s.book_id AS bookId, b.title AS title, b.cover_seed AS coverSeed, b.local_cover AS localCover,
            ${c.target_type === 'minutes' ? 'CAST(SUM(s.seconds) / 60 AS INTEGER)' : 'SUM(s.pages)'} AS amount
     FROM reading_sessions s JOIN books b ON b.id = s.book_id
     WHERE s.deleted_at IS NULL AND s.local_date BETWEEN ? AND ?
     GROUP BY s.book_id HAVING amount > 0 ORDER BY amount DESC`,
    [c.starts_on, c.ends_on],
  );

  return {
    value,
    pct: c.target > 0 ? Math.min(100, (value / c.target) * 100) : 0,
    breakdown,
    byBook,
    daysRead: days.filter((d) => d.seconds > 0 || d.pages > 0).length,
    booksRead: byBook.length,
  };
}

export type ChallengeWithProgress = ChallengeRow & { progress: Progress };

export function useChallenges(goal: Pick<ProfileRow, 'goal_type' | 'daily_goal'> | null) {
  return useLiveQuery(
    ['challenges', 'reading_sessions', 'books', 'profiles'],
    async () => {
      if (!goal) return [];
      const rows = await all('challenges', 'deleted_at IS NULL', [], 'ORDER BY starts_on DESC, created_at DESC');
      return Promise.all(rows.map(async (c) => ({ ...c, progress: await computeProgress(c, goal) })));
    },
    [goal?.goal_type, goal?.daily_goal],
  );
}

// ------------------------------------------------------------------------------------------------
// Create / delete / status
// ------------------------------------------------------------------------------------------------
export async function createChallenge(userId: string, period: Period, target_type: TargetType, target: number): Promise<string> {
  const id = newId();
  await save('challenges', {
    id,
    user_id: userId,
    period,
    target_type,
    target,
    ...periodBounds(period),
    status: 'active',
    completed_at: null,
    created_at: nowIso(),
  });
  return id;
}

export const deleteChallenge = (id: string) => remove('challenges', id);

/**
 * Moves challenges on: target reached → completed (the celebration shows once);
 * period over without reaching it → missed. Returns ids that just completed.
 */
export async function updateStatuses(list: ChallengeWithProgress[]): Promise<string[]> {
  const today = localDate();
  const justCompleted: string[] = [];
  for (const c of list) {
    if (c.status !== 'active') continue;
    if (c.progress.value >= c.target) {
      await patch('challenges', c.id, { status: 'completed', completed_at: nowIso() });
      justCompleted.push(c.id);
    } else if (today > c.ends_on) {
      await patch('challenges', c.id, { status: 'missed' });
    }
  }
  return justCompleted;
}

const CELEBRATED = 'challenges:celebrated';
export async function needsCelebration(id: string) {
  const raw = await Storage.getItem(CELEBRATED);
  return !(raw ? (JSON.parse(raw) as string[]) : []).includes(id);
}
export async function markCelebrated(id: string) {
  const raw = await Storage.getItem(CELEBRATED);
  const list = raw ? (JSON.parse(raw) as string[]) : [];
  if (!list.includes(id)) await Storage.setItem(CELEBRATED, JSON.stringify([...list, id].slice(-50)));
}
