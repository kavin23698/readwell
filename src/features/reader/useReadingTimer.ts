// Reading time: counts only while the reader is open, the app is in the foreground, and there was
// a page turn or scroll in the last 2 minutes. Sessions are saved by local calendar day.
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { newId, nowIso, save } from '@/db';
import type { BookRow } from '@/db/schema';
import { localDate } from '@/lib/dates';

const IDLE_MS = 2 * 60 * 1000;
const MIN_SECONDS = 10; // ignore accidental opens

export type SessionTotals = { seconds: number; pages: number };

export function useReadingTimer(book: Pick<BookRow, 'id' | 'user_id'>) {
  const seconds = useRef(0);
  const pages = useRef(new Set<number>());
  const startedAt = useRef<string>(nowIso());
  const day = useRef(localDate());
  const lastActivity = useRef(Date.now());
  const active = useRef(AppState.currentState === 'active');
  const totals = useRef<SessionTotals>({ seconds: 0, pages: 0 }); // whole visit, across saved chunks

  const pagesTurned = () => Math.max(0, pages.current.size - 1);

  /** Saves the current chunk as a reading session and starts a new one. */
  const flush = useCallback(async () => {
    const s = seconds.current;
    const p = pagesTurned();
    const last = [...pages.current].pop();
    seconds.current = 0;
    pages.current = new Set(last != null ? [last] : []);
    const started = startedAt.current;
    startedAt.current = nowIso();
    const d = day.current;
    day.current = localDate();
    if (s < MIN_SECONDS && p === 0) return;
    await save('reading_sessions', {
      id: newId(),
      user_id: book.user_id,
      book_id: book.id,
      local_date: d,
      started_at: started,
      ended_at: nowIso(),
      seconds: s,
      pages: p,
      created_at: nowIso(),
    });
  }, [book.id, book.user_id]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!active.current) return;
      if (Date.now() - lastActivity.current > IDLE_MS) return; // paused: no page turns or scrolling
      if (localDate() !== day.current) {
        flush(); // midnight: the rest counts toward the new day
        return;
      }
      seconds.current += 1;
      totals.current.seconds += 1;
    }, 1000);
    const sub = AppState.addEventListener('change', (s) => {
      const nowActive = s === 'active';
      if (!nowActive && active.current) flush(); // save when the app goes to the background
      if (nowActive) lastActivity.current = Date.now();
      active.current = nowActive;
    });
    return () => {
      clearInterval(tick);
      sub.remove();
    };
  }, [flush]);

  const onActivity = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  const onPage = useCallback((page: number | null | undefined) => {
    if (page == null) return;
    lastActivity.current = Date.now();
    if (!pages.current.has(page)) {
      if (pages.current.size > 0) totals.current.pages += 1;
      pages.current.add(page);
    }
  }, []);

  /** Call when leaving the reader: saves the last chunk and returns the visit's totals. */
  const finish = useCallback(async (): Promise<SessionTotals> => {
    await flush();
    return { ...totals.current };
  }, [flush]);

  return { onActivity, onPage, finish };
}
