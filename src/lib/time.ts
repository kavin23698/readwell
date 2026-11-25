// "HH:MM" (24h) ⇄ 12-hour parts used by the reminder wheel.
export type Time12 = { hour: number; minute: number; pm: boolean }; // hour 1–12

export function to12(hhmm: string): Time12 {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h % 12 === 0 ? 12 : h % 12, minute: m, pm: h >= 12 };
}

export function to24({ hour, minute, pm }: Time12): string {
  const h = (hour % 12) + (pm ? 12 : 0);
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatTime(hhmm: string): string {
  const t = to12(hhmm);
  return `${t.hour}:${String(t.minute).padStart(2, '0')} ${t.pm ? 'PM' : 'AM'}`;
}
