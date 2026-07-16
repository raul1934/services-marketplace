import { useEffect, useState } from 'react';

/**
 * Follows `value`, but only adopts `true` once it has held for `delayMs`.
 * Dropping back to `false` is immediate.
 *
 * Tracking flickers off for a frame or two all the time; without this the
 * "lost the surface" overlay would strobe. Recovering, on the other hand, should
 * feel instant.
 */
export function useSettled(value: boolean, delayMs: number): boolean {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    if (!value) {
      setSettled(false);
      return;
    }
    const id = setTimeout(() => setSettled(true), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return settled;
}
