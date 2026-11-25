import { useCallback, useEffect, useState } from 'react';

/** Countdown used by "Resend link in 0:42" buttons. */
export function useCooldown(seconds = 60, startRunning = false) {
  const [left, setLeft] = useState(startRunning ? seconds : 0);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const start = useCallback(() => setLeft(seconds), [seconds]);
  const label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  return { left, running: left > 0, start, label };
}
