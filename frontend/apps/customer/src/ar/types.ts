import { Vec3 } from './geometry/vector';

/** How much the reticle trusts an AR hit before it can be confirmed. */
export enum MeasureMode {
  /** Confirm only on a detected plane — most accurate. */
  Surface = 'surface',
  /** Confirm on any AR hit, including feature points — works where no plane is found,
   *  using ARCore's depth estimate (slightly less accurate). */
  Free = 'free',
}

/** Where the reticle is, whether it snapped to a point, and if it's trustworthy. */
export interface ReticleState {
  position: Vec3;
  /** Index of the snapped point, or -1 when free. */
  snapIndex: number;
  /** True when this hit is safe to confirm (plane / snap, or any hit in Free mode). */
  reliable: boolean;
}

/** Metrics derived from the current measurement, consumed by the overlay UI. */
export interface MeasurementMetrics {
  count: number;
  perimeter: number;
  area: number;
  /** Length of the live rubber-band segment (0 when line mode is off). */
  liveLength: number;
  reticle: ReticleState | null;
  /** True when confirming the reticle would make the polygon self-intersect. */
  crossing: boolean;
}

export const EMPTY_METRICS: MeasurementMetrics = {
  count: 0,
  perimeter: 0,
  area: 0,
  liveLength: 0,
  reticle: null,
  crossing: false,
};

/** Monotonic command counters + mode flags the overlay sends down to the scene. */
export interface SceneCommands {
  add: number;
  undo: number;
  clear: number;
  lineMode: boolean;
  mode: MeasureMode;
}

/** Why tracking is degraded (mirrors ViroARTrackingReasonConstants). */
export enum TrackingReason {
  None = 1,
  ExcessiveMotion = 2,
  InsufficientFeatures = 3,
}

/** Everything the scene receives through `ViroARSceneNavigator.viroAppProps`. */
export interface MeasureAppProps extends SceneCommands {
  onMetrics: (metrics: MeasurementMetrics) => void;
  onTracking: (isNormal: boolean, reason: number) => void;
}

/** Shape ViroReact injects into a scene component. */
export interface SceneNavigatorProps {
  sceneNavigator: { viroAppProps: MeasureAppProps };
}
