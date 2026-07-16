/** Tunable constants for the AR measurement feature. Distances are in metres. */

// Reticle / hit testing
export const HIT_THROTTLE_M = 0.003; // ignore camera hits that move less than this
export const SNAP_RADIUS_M = 0.05; // snap the reticle to a point within this radius

export const RETICLE_RADIUS_M = 0.01;
export const SNAP_RETICLE_RADIUS_M = 0.016; // slightly larger when snapped

// Markers & lines
export const POINT_RADIUS_M = 0.02;
export const LINE_THICKNESS_M = 0.01;
export const PREVIEW_LINE_THICKNESS_M = 0.008;

// Area fill
export const FILL_OFFSET_M = 0.004; // sink the fill below the lines so they stay on top
export const FILL_OPACITY = 0.5;

// Labels (ViroText scale is a multiplier on its point size)
export const LABEL_SCALE = 0.2;
export const AREA_LABEL_SCALE = 0.28;

export const AMBIENT_INTENSITY = 1000;
export const MIN_POLYGON_POINTS = 3;

// Level indicator: how far the phone may tilt left/right and still read as level.
export const LEVEL_TOLERANCE_DEG = 4;
export const LEVEL_UPDATE_MS = 100;

// Brand colours reused by the overlay
export const COLOR_ACCENT = '#ff6a3d';
export const COLOR_SNAP = '#2bd576';
export const COLOR_LEVEL_OK = '#2bd576';
export const COLOR_LEVEL_OFF = '#e11d48';

// How long the surface must stay lost before the scanning overlay appears
// (tracking blips off for a frame or two constantly; without this it strobes).
export const SCAN_OVERLAY_DELAY_MS = 700;

// Dragging a placed point: the grabbed handle swells so your fingertip doesn't hide it.
export const DRAG_POINT_RADIUS_M = 0.032;

// Reticle stabilisation: how far it eases toward each new hit (0 = frozen, 1 = raw),
// and the jump size that means "you aimed elsewhere" — follow instantly past it.
export const RETICLE_SMOOTHING = 0.28;
export const RETICLE_SNAP_RESET_M = 0.18;
