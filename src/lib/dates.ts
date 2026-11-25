// Calendar-day helpers. Days run on the phone's local time zone, midnight to midnight.

/** "YYYY-MM-DD" for the local calendar day. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parses "YYYY-MM-DD" as a local date (noon, so DST shifts never change the day). */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(s: string, n: number): string {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + n);
  return localDate(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseLocalDate(b).getTime() - parseLocalDate(a).getTime()) / 86_400_000);
}

const long = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

/** "Tuesday, 25 November" */
export const formatLongDate = (d: Date = new Date()) => long.format(d);
/** "Tue" */
export const formatWeekday = (s: string) => shortDay.format(parseLocalDate(s));
/** "25 Nov" */
export const formatDayMonth = (d: Date) => dayMonth.format(d);
/** "7:12 AM" */
export const formatClock = (d: Date) => time.format(d);

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 4) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "2 hours ago", "Yesterday", "4 days ago", "12 Nov" */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const mins = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const days = daysBetween(localDate(d), localDate(now));
  if (days === 0) {
    const h = Math.round(mins / 60);
    return `${h} hour${h === 1 ? '' : 's'} ago`;
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDayMonth(d);
}
