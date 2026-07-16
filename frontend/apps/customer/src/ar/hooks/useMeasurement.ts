import { useMemo, useState } from 'react';
import { EMPTY_METRICS, MeasureAppProps, MeasureMode, MeasurementMetrics } from '../types';

/**
 * Screen-side state for the AR measurement: it holds the command counters and
 * the latest metrics reported by the scene, and exposes the `viroAppProps`
 * object plus action handlers. The scene owns the actual points (see
 * MeasureScene) — this hook only drives it and reflects what it reports back.
 */
export function useMeasurement() {
  const [cmd, setCmd] = useState({ add: 0, undo: 0, clear: 0 });
  const [mode, setMode] = useState<MeasureMode>(MeasureMode.Surface);
  const [metrics, setMetrics] = useState<MeasurementMetrics>(EMPTY_METRICS);
  const [tracking, setTracking] = useState(false);
  const [trackingReason, setTrackingReason] = useState(0);

  const appProps = useMemo<MeasureAppProps>(
    () => ({
      add: cmd.add,
      undo: cmd.undo,
      clear: cmd.clear,
      // Always on: you're always measuring from the last point, so hiding the rubber
      // band only ever hid what you were about to measure.
      lineMode: true,
      mode,
      onMetrics: setMetrics,
      onTracking: (isNormal, reason) => {
        setTracking(isNormal);
        setTrackingReason(reason);
      },
    }),
    [cmd, mode],
  );

  return {
    metrics,
    tracking,
    trackingReason,
    mode,
    appProps,
    confirmPoint: () => setCmd((c) => ({ ...c, add: c.add + 1 })),
    undo: () => setCmd((c) => ({ ...c, undo: c.undo + 1 })),
    clear: () => setCmd((c) => ({ ...c, clear: c.clear + 1 })),
    setMode,
  };
}
