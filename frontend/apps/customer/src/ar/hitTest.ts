/** AR hit-test result handling: pick the best surface hit and snap to points. */

import { Vec3, Vector3 } from './geometry/vector';

/** Partial shape of a ViroReact AR hit-test result. */
export interface ViroHitResult {
  type: string;
  transform?: { position?: Vec3 };
}

/** A usable hit and whether it landed on a detected plane (accurate) or not. */
export interface Hit {
  position: Vec3;
  isPlane: boolean;
}

/** Result of snapping the reticle to the nearest existing point (index -1 = free). */
export interface SnapResult {
  position: Vec3;
  snapIndex: number;
}

const PLANE_TYPES = ['ExistingPlaneUsingExtent', 'ExistingPlane', 'EstimatedHorizontalPlane'];

/** Best surface position under the camera centre; `isPlane` is false for feature points.
 *
 * The position array is CLONED out of the native event. React Native recycles the
 * `nativeEvent...transform.position` backing array across the per-frame hit-test
 * callbacks, so storing it by reference makes every confirmed point alias the same
 * (mutating) array — collapsing all points to one coordinate and yielding 0 m / 0 m².
 * Cloning here severs that shared reference so each point keeps its own coordinate. */
export function bestHit(results: ViroHitResult[] | undefined): Hit | null {
  if (!results || results.length === 0) return null;
  for (const type of PLANE_TYPES) {
    const hit = results.find((r) => r.type === type && r.transform?.position);
    if (hit) return { position: [...hit.transform!.position!] as Vec3, isPlane: true };
  }
  const feature = results.find((r) => r.transform?.position);
  return feature ? { position: [...feature.transform!.position!] as Vec3, isPlane: false } : null;
}

/** Snap `position` to the nearest existing point within `radius`, else keep it. */
export function snapToPoint(position: Vec3, points: Vec3[], radius: number): SnapResult {
  let index = -1;
  let closest = radius;
  for (let i = 0; i < points.length; i++) {
    const d = Vector3.distance(position, points[i]);
    if (d < closest) {
      closest = d;
      index = i;
    }
  }
  return index >= 0 ? { position: points[index], snapIndex: index } : { position, snapIndex: -1 };
}
