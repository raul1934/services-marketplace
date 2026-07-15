/** Small, pure business rules for the AR measurement — keeps the UI declarative. */

import { MIN_POLYGON_POINTS } from './constants';
import { MeasurementMetrics } from './types';

/** A closed polygon (triangle or bigger) whose area is shown. */
export const isPolygon = (count: number): boolean => count >= MIN_POLYGON_POINTS;

/** There is at least one placed point (so undo/clear make sense). */
export const hasMeasurement = (count: number): boolean => count > 0;

/** The live rubber-band should be drawn from the last point to the reticle. */
export const canDrawLive = (count: number, lineMode: boolean): boolean => lineMode && count >= 1;

/** Confirm is allowed: a reliable reticle (plane/snap/touch) that wouldn't cross a line. */
export const canConfirmPoint = (m: MeasurementMetrics): boolean => !!m.reticle?.reliable && !m.crossing;

/** The reticle is currently snapped onto an existing point. */
export const isSnapped = (m: MeasurementMetrics): boolean => (m.reticle?.snapIndex ?? -1) >= 0;
