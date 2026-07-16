/**
 * Minimal 3D/2D vector maths used by the AR measurement feature.
 * Vectors are plain tuples so they pass straight to ViroReact props with no
 * conversion.
 */

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];

export const Vector3 = {
  add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  subtract: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  scale: (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  length: (a: Vec3): number => Math.hypot(a[0], a[1], a[2]),
  normalize: (a: Vec3): Vec3 => {
    const l = Vector3.length(a) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  },
  distance: (a: Vec3, b: Vec3): number => Vector3.length(Vector3.subtract(a, b)),
  /** Move `t` of the way from `a` to `b` (t=0 → a, t=1 → b). */
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ],
  centroid: (points: Vec3[]): Vec3 => {
    const n = points.length || 1;
    const sum = points.reduce<Vec3>((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
    return [sum[0] / n, sum[1] / n, sum[2] / n];
  },
};
