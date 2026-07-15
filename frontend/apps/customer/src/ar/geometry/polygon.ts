/**
 * Polygon geometry for the AR measurement: best-fit plane projection, area,
 * perimeter and self-intersection detection. Points are 3D but roughly coplanar
 * (they sit on a detected AR surface), so operations project them onto the
 * polygon's best-fit plane and work in 2D there.
 */

import { Vec2, Vec3, Vector3 } from './vector';

export interface PlaneBasis {
  origin: Vec3;
  u: Vec3;
  v: Vec3;
  normal: Vec3;
}

/** Best-fit plane normal via Newell's method (robust for non-planar input). */
export function planeNormal(points: Vec3[]): Vec3 {
  let n: Vec3 = [0, 0, 0];
  for (let i = 0; i < points.length; i++) {
    const c = points[i];
    const d = points[(i + 1) % points.length];
    n = [
      n[0] + (c[1] - d[1]) * (c[2] + d[2]),
      n[1] + (c[2] - d[2]) * (c[0] + d[0]),
      n[2] + (c[0] - d[0]) * (c[1] + d[1]),
    ];
  }
  return Vector3.length(n) > 1e-6 ? Vector3.normalize(n) : [0, 1, 0];
}

/** Orthonormal basis (u, v) on the polygon's plane, for 2D projection. */
export function planeBasis(points: Vec3[]): PlaneBasis {
  const normal = planeNormal(points);
  const ref: Vec3 = Math.abs(normal[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = Vector3.normalize(Vector3.cross(normal, ref));
  const v = Vector3.normalize(Vector3.cross(normal, u));
  return { origin: points[0], u, v, normal };
}

export function projectTo2D(p: Vec3, basis: PlaneBasis): Vec2 {
  const d = Vector3.subtract(p, basis.origin);
  return [Vector3.dot(d, basis.u), Vector3.dot(d, basis.v)];
}

/** Shoelace area of a 2D polygon. */
export function polygonArea2D(points: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    a += points[i][0] * points[j][1] - points[j][0] * points[i][1];
  }
  return Math.abs(a) / 2;
}

/** Area (m²) of a 3D polygon projected onto its best-fit plane. */
export function polygonArea(points: Vec3[]): number {
  if (points.length < 3) return 0;
  const basis = planeBasis(points);
  return polygonArea2D(points.map((p) => projectTo2D(p, basis)));
}

/** Summed edge length; includes the closing edge when `closed`. */
export function perimeter(points: Vec3[], closed: boolean): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += Vector3.distance(points[i - 1], points[i]);
  if (closed && points.length >= 3) total += Vector3.distance(points[points.length - 1], points[0]);
  return total;
}

/** Proper 2D segment intersection (shared endpoints / collinear touches don't count). */
export function segmentsIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const orient = (a: Vec2, b: Vec2, c: Vec2) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Does the closed polygon formed by `points` cross itself? */
export function isSelfIntersecting(points: Vec3[]): boolean {
  if (points.length < 4) return false;
  const basis = planeBasis(points);
  const p = points.map((q) => projectTo2D(q, basis));
  const n = p.length;
  for (let i = 0; i < n; i++) {
    const iNext = (i + 1) % n;
    for (let j = i + 1; j < n; j++) {
      const jNext = (j + 1) % n;
      if (i === j || i === jNext || iNext === j || iNext === jNext) continue; // adjacent edges share a vertex
      if (segmentsIntersect(p[i], p[iNext], p[j], p[jNext])) return true;
    }
  }
  return false;
}
