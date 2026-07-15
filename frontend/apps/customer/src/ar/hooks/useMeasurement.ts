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
  const [lineMode, setLineMode] = useState(false);
  const [mode, setMode] = useState<MeasureMode>(MeasureMode.Surface);
  const [metrics, setMetrics] = useState<MeasurementMetrics>(EMPTY_METRICS);
  const [tracking, setTracking] = useState(false);
  const [trackingReason, setTrackingReason] = useState(0);

  const appProps = useMemo<MeasureAppProps>(
    () => ({
      add: cmd.add,
      undo: cmd.undo,
      clear: cmd.clear,
      lineMode,
      mode,
      onMetrics: setMetrics,
      onTracking: (isNormal, reason) => {
        setTracking(isNormal);
        setTrackingReason(reason);
      },
    }),
    [cmd, lineMode, mode],
  );

  return {
    metrics,
    tracking,
    trackingReason,
    lineMode,
    mode,
    appProps,
    confirmPoint: () => setCmd((c) => ({ ...c, add: c.add + 1 })),
    undo: () => setCmd((c) => ({ ...c, undo: c.undo + 1 })),
    clear: () => setCmd((c) => ({ ...c, clear: c.clear + 1 })),
    toggleLine: () => setLineMode((v) => !v),
    setMode,
  };
}
