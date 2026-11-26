// Lifetime and period stats for Profile (61) and Detailed stats (62).
import { db, useLiveQuery } from '@/db';
import { addDays, localDate, parseLocalDate } from '@/lib/dates';

export type Lifetime = { booksFinished: number; pages: number; seconds: number; highlights: number; notes: number; avgRatio: number };

export function useLifetime(goal: { goal_type: 'minutes' | 'pages'; daily_goal: number } | null) {
  return useLiveQuery(
    ['books', 'reading_sessions', 'highlights', 'notes', 'profiles'],
    async (): Promise<Lifetime> => {
      const n = async (sql: string) => (await db.getFirstAsync<{ n: number | null }>(sql))?.n ?? 0;
      const days = await db.getAllAsync<{ seconds: number; pages: number }>(
        'SELECT SUM(seconds) AS seconds, SUM(pages) AS pages FROM reading_sessions WHERE deleted_at IS NULL GROUP BY local_date',
      );
      const ratio = (d: { seconds: number; pages: number }) =>
        goal && goal.daily_goal > 0 ? Math.min(150, ((goal.goal_type === 'pages' ? d.pages : d.seconds / 60) / goal.daily_goal) * 100) : 0;
      return {
        booksFinished: await n('SELECT COUNT(*) AS n FROM books WHERE deleted_at IS NULL AND finished_at IS NOT NULL'),
        pages: await n('SELECT SUM(pages) AS n FROM reading_sessions WHERE deleted_at IS NULL'),
        seconds: await n('SELECT SUM(seconds) AS n FROM reading_sessions WHERE deleted_at IS NULL'),
        highlights: await n('SELECT COUNT(*) AS n FROM highlights WHERE deleted_at IS NULL'),
        notes: await n('SELECT COUNT(*) AS n FROM notes WHERE deleted_at IS NULL'),
        avgRatio: days.length ? Math.round(days.reduce((s, d) => s + ratio(d), 0) / days.length) : 0,
      };
    },
    [goal?.goal_type, goal?.daily_goal],
  );
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

export type PeriodStats = {
  seconds: number;
  pages: number;
  prevSeconds: number;
  prevPages: number;
  bars: { label: string; value: number }[];
  finishedByMonth: { month: string; books: { id: string; title: string; cover_seed: number; local_cover: string | null }[] }[];
};

/** This week (Mon–Sun) or this month vs the previous one; minutes per day (week) or per week (month). */
export function usePeriodStats(period: 'week' | 'month') {
  return useLiveQuery(
    ['reading_sessions', 'books'],
    async (): Promise<PeriodStats> => {
      const today = localDate();
      const d = parseLocalDate(today);
      let start: string, end: string, prevStart: string, prevEnd: string;
      if (period === 'week') {
        start = addDays(today, -((d.getDay() + 6) % 7));
        end = addDays(start, 6);
        prevStart = addDays(start, -7);
        prevEnd = addDays(start, -1);
      } else {
        start = localDate(new Date(d.getFullYear(), d.getMonth(), 1, 12));
        end = localDate(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
        prevStart = localDate(new Date(d.getFullYear(), d.getMonth() - 1, 1, 12));
        prevEnd = addDays(start, -1);
      }
      const sum = (a: string, b: string) =>
        db.getFirstAsync<{ s: number | null; p: number | null }>(
          'SELECT SUM(seconds) AS s, SUM(pages) AS p FROM reading_sessions WHERE deleted_at IS NULL AND local_date BETWEEN ? AND ?',
          [a, b],
        );
      const cur = await sum(start, end);
      const prev = await sum(prevStart, prevEnd);
      const days = await db.getAllAsync<{ date: string; s: number }>(
        'SELECT local_date AS date, SUM(seconds) AS s FROM reading_sessions WHERE deleted_at IS NULL AND local_date BETWEEN ? AND ? GROUP BY local_date',
        [start, end],
      );
      const by = new Map(days.map((x) => [x.date, x.s]));
      const bars: PeriodStats['bars'] = [];
      if (period === 'week') {
        for (let i = 0; i < 7; i++) {
          const date = addDays(start, i);
          bars.push({ label: new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(parseLocalDate(date)), value: Math.round((by.get(date) ?? 0) / 60) });
        }
      } else {
        let w = 0;
        for (let date = start; date <= end; date = addDays(date, 7)) {
          let s = 0;
          for (let i = 0; i < 7; i++) {
            const x = addDays(date, i);
            if (x <= end) s += by.get(x) ?? 0;
          }
          bars.push({ label: `W${++w}`, value: Math.round(s / 60) });
        }
      }
      // Books finished per month, last 3 months.
      const months: PeriodStats['finishedByMonth'] = [];
      for (let k = 2; k >= 0; k--) {
        const m0 = new Date(d.getFullYear(), d.getMonth() - k, 1, 12);
        const a = localDate(m0);
        const b = localDate(new Date(m0.getFullYear(), m0.getMonth() + 1, 0, 12));
        const books = await db.getAllAsync<{ id: string; title: string; cover_seed: number; local_cover: string | null }>(
          "SELECT id, title, cover_seed, local_cover FROM books WHERE deleted_at IS NULL AND finished_at IS NOT NULL AND date(finished_at, 'localtime') BETWEEN ? AND ? ORDER BY finished_at",
          [a, b],
        );
        months.push({ month: new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(m0), books });
      }
      return { seconds: cur?.s ?? 0, pages: cur?.p ?? 0, prevSeconds: prev?.s ?? 0, prevPages: prev?.p ?? 0, bars, finishedByMonth: months };
    },
    [period],
  );
}
