import React from 'react';
import {
  ViroARPlaneSelector,
  ViroARScene,
  ViroAmbientLight,
  ViroGeometry,
  ViroNode,
  ViroPolyline,
  ViroSphere,
  ViroText,
  ViroTrackingStateConstants,
} from '@reactvision/react-viro';

import {
  AMBIENT_INTENSITY,
  AREA_LABEL_SCALE,
  FILL_OFFSET_M,
  FILL_OPACITY,
  HIT_THROTTLE_M,
  LABEL_SCALE,
  LINE_THICKNESS_M,
  DRAG_POINT_RADIUS_M,
  POINT_RADIUS_M,
  PREVIEW_LINE_THICKNESS_M,
  RETICLE_RADIUS_M,
  SNAP_RADIUS_M,
  SNAP_RETICLE_RADIUS_M,
} from './constants';
import { Vec3, Vector3 } from './geometry/vector';
import { isSelfIntersecting, perimeter, planeNormal, polygonArea } from './geometry/polygon';
import { bestHit, snapToPoint, ViroHitResult } from './hitTest';
import { Material } from './materials';
import { canDrawLive, isPolygon } from './rules';
import { arTextStyles } from './styles';
import { MeasureAppProps, MeasureMode, MeasurementMetrics, ReticleState, SceneNavigatorProps } from './types';

interface State {
  points: Vec3[];
  reticle: ReticleState | null;
  tracking: boolean;
  /** Index of the point being dragged, or null. Drives its enlarged handle. */
  dragging: number | null;
}

/**
 * AR scene for measuring points, lines, and polygon area.
 *
 * Kept as a class deliberately: `onCameraARHitTest` fires every frame (~30–60 fps)
 * and the handler must read the *current* points to snap and detect crossings. A
 * class instance's `this.state` is always fresh for that native callback; the hooks
 * equivalent would need several `ref`s mirroring state (more moving parts, easy to
 * get subtly wrong). The overlay drives it with monotonic command counters and
 * receives derived metrics via `onMetrics`.
 *
 * Both modes raycast from the screen centre onto the real world, so every point sits
 * at its true depth. They differ only in what counts as reliable enough to confirm
 * (see MeasureMode):
 * - `surface`: only a hit on a detected plane. Keeps the first segment off unstable
 *   feature points.
 * - `free`: any AR hit, including feature points — works where no plane is detected,
 *   using ARCore's depth estimate.
 */
export class MeasureScene extends React.Component<SceneNavigatorProps, State> {
  state: State = { points: [], reticle: null, tracking: false, dragging: null };
  private lastHit: Vec3 | null = null;
  private seen = { add: 0, undo: 0, clear: 0 };

  private get app(): MeasureAppProps {
    return this.props.sceneNavigator.viroAppProps;
  }

  componentDidMount() {
    this.seen = { add: this.app.add, undo: this.app.undo, clear: this.app.clear };
  }

  componentDidUpdate() {
    this.applyCommands();
  }

  // --- metrics (all derived, nothing cached) ------------------------------
  private buildMetrics(reticle: ReticleState | null): MeasurementMetrics {
    const { points } = this.state;
    const closed = isPolygon(points.length);
    let liveLength = 0;
    let crossing = false;
    if (reticle && canDrawLive(points.length, this.app.lineMode)) {
      liveLength = Vector3.distance(points[points.length - 1], reticle.position);
      crossing = isSelfIntersecting([...points, reticle.position]);
    }
    return {
      count: points.length,
      perimeter: perimeter(points, closed),
      area: polygonArea(points),
      liveLength,
      reticle,
      crossing,
    };
  }

  private report(reticle: ReticleState | null) {
    this.app.onMetrics(this.buildMetrics(reticle));
  }

  private setReticle(reticle: ReticleState) {
    this.setState({ reticle }, () => this.report(reticle));
  }

  // --- commands from the overlay ------------------------------------------
  private applyCommands() {
    const { add, undo, clear } = this.app;
    let points = this.state.points;
    let changed = false;

    if (add !== this.seen.add) {
      this.seen.add = add;
      const reticle = this.state.reticle;
      // Guard again here so a laggy overlay can never confirm an unreliable/crossing point.
      if (reticle?.reliable && !isSelfIntersecting([...points, reticle.position])) {
        // Clone the coordinate so it can never alias a recycled native array (see bestHit).
        points = [...points, [...reticle.position] as Vec3];
        changed = true;
      }
    }
    if (undo !== this.seen.undo) {
      this.seen.undo = undo;
      points = points.slice(0, -1);
      changed = true;
    }
    if (clear !== this.seen.clear) {
      this.seen.clear = clear;
      points = [];
      changed = true;
    }

    if (changed) this.setState({ points }, () => this.report(this.state.reticle));
  }

  // --- AR callbacks --------------------------------------------------------
  /** Reticle from a raycast at the screen centre. Both modes use the real hit depth;
   *  Free mode also trusts feature-point hits, Surface mode only planes/snaps. */
  private onHit = (event: { hitTestResults: ViroHitResult[] }) => {
    const hit = bestHit(event.hitTestResults);
    if (!hit) return;
    if (this.lastHit && Vector3.distance(this.lastHit, hit.position) < HIT_THROTTLE_M) return;
    this.lastHit = hit.position;
    const snap = snapToPoint(hit.position, this.state.points, SNAP_RADIUS_M);
    const snapped = snap.snapIndex >= 0;
    const reliable = this.app.mode === MeasureMode.Free ? true : hit.isPlane || snapped;
    this.setReticle({ position: snap.position, snapIndex: snap.snapIndex, reliable });
  };

  /**
   * Drag a placed point along the detected plane. Viro reports the node's new world
   * position continuously (dragType "FixedToPlane"), so we move the point and let
   * the metrics recompute — you see the length change under your finger.
   *
   * The dragged point is excluded from the crossing check against itself, but a drag
   * that would make the polygon self-intersect is rejected (same rule as placing).
   */
  private onDragPoint = (index: number, dragToPos: Vec3) => {
    const moved: Vec3 = [...dragToPos] as Vec3; // clone: Viro reuses the event array
    const points = this.state.points.map((p, i) => (i === index ? moved : p));
    if (isSelfIntersecting(points)) return; // keep the last valid position
    this.setState({ points, dragging: index }, () => this.report(this.state.reticle));
  };

  private onDragEnd = () => this.setState({ dragging: null }, () => this.report(this.state.reticle));

  private onTracking = (trackingState: number, reason?: number) => {
    const normal = trackingState === ViroTrackingStateConstants.TRACKING_NORMAL;
    this.setState({ tracking: normal });
    this.app.onTracking(normal, reason ?? 0);
  };

  // --- 3D content ----------------------------------------------------------
  private renderEdges(points: Vec3[], closed: boolean) {
    const edges: Array<[Vec3, Vec3]> = [];
    for (let i = 1; i < points.length; i++) edges.push([points[i - 1], points[i]]);
    if (closed) edges.push([points[points.length - 1], points[0]]);

    return edges.map(([a, b], i) => {
      const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, (a[2] + b[2]) / 2];
      return (
        <ViroNode key={`edge-${i}`}>
          <ViroPolyline position={[0, 0, 0]} points={[a, b]} thickness={LINE_THICKNESS_M} materials={[Material.Line]} />
          <ViroText
            text={`${Vector3.distance(a, b).toFixed(2)} m`}
            position={mid}
            scale={[LABEL_SCALE, LABEL_SCALE, LABEL_SCALE]}
            style={arTextStyles.segment}
            transformBehaviors={['billboard']}
          />
        </ViroNode>
      );
    });
  }

  private renderLivePreview(points: Vec3[], reticle: ReticleState) {
    const a = points[points.length - 1];
    const b = reticle.position;
    const mid: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.02, (a[2] + b[2]) / 2];
    return (
      <ViroNode key="live">
        <ViroPolyline position={[0, 0, 0]} points={[a, b]} thickness={PREVIEW_LINE_THICKNESS_M} materials={[Material.Preview]} />
        <ViroText
          text={`${Vector3.distance(a, b).toFixed(2)} m`}
          position={mid}
          scale={[LABEL_SCALE, LABEL_SCALE, LABEL_SCALE]}
          style={arTextStyles.live}
          transformBehaviors={['billboard']}
        />
      </ViroNode>
    );
  }

  private renderArea(points: Vec3[]) {
    const normal = planeNormal(points);
    const sink = Vector3.scale(normal, FILL_OFFSET_M);
    const base = points.map((p) => Vector3.subtract(p, sink));
    const center = Vector3.subtract(Vector3.centroid(points), sink);
    const vertices: Vec3[] = [center, ...base];
    const triangles: Vec3[] = [];
    for (let i = 0; i < points.length; i++) triangles.push([0, i + 1, ((i + 1) % points.length) + 1]);
    const label = Vector3.add(Vector3.centroid(points), [0, 0.01, 0]);

    return (
      <>
        <ViroGeometry
          key="fill"
          vertices={vertices}
          triangleIndices={triangles}
          normals={vertices.map(() => normal)}
          texcoords={vertices.map(() => [0, 0] as [number, number])}
          materials={[Material.Fill]}
          opacity={FILL_OPACITY}
        />
        <ViroText
          key="area"
          text={`${polygonArea(points).toFixed(2)} m²`}
          position={label}
          scale={[AREA_LABEL_SCALE, AREA_LABEL_SCALE, AREA_LABEL_SCALE]}
          style={arTextStyles.area}
          transformBehaviors={['billboard']}
        />
      </>
    );
  }

  render() {
    const { points, reticle } = this.state;
    const closed = isPolygon(points.length);
    const showLive = reticle !== null && canDrawLive(points.length, this.app.lineMode);

    return (
      <ViroARScene
        // Enable BOTH horizontal (floors/terrain) and vertical (walls) plane detection.
        // Viro's default is horizontal-only, so without this walls are never detected and
        // the hit test falls back to feature points, whose depth is garbage.
        anchorDetectionTypes={['PlanesHorizontal', 'PlanesVertical']}
        onTrackingUpdated={this.onTracking}
        onCameraARHitTest={this.onHit}
      >
        <ViroAmbientLight color="#ffffff" intensity={AMBIENT_INTENSITY} />

        {/* Visualise every detected plane as a translucent surface. */}
        <ViroARPlaneSelector minWidth={0.1} minHeight={0.1} />


        {closed ? this.renderArea(points) : null}

        {reticle ? (
          <ViroSphere
            position={reticle.position}
            radius={reticle.snapIndex >= 0 ? SNAP_RETICLE_RADIUS_M : RETICLE_RADIUS_M}
            materials={[reticle.snapIndex >= 0 ? Material.Snap : Material.Reticle]}
          />
        ) : null}

        {/* Each point is a drag handle: grab it and it slides along the plane, with the
            length updating live. The one under your finger swells so it isn't hidden by
            your fingertip — the fix for not being able to see where you're placing it. */}
        {points.map((p, i) => (
          <ViroSphere
            key={`point-${i}`}
            position={p}
            radius={this.state.dragging === i ? DRAG_POINT_RADIUS_M : POINT_RADIUS_M}
            materials={[this.state.dragging === i ? Material.Snap : Material.Point]}
            // FixedToWorld raycasts against the real geometry, so the point stays stuck
            // to the surface as you drag. Don't derive a dragPlane from the points: with
            // fewer than three (or collinear ones) the normal collapses to zero, and the
            // NaN that normalizing produces crashes Viro's native side.
            dragType="FixedToWorld"
            onDrag={(dragToPos) => this.onDragPoint(i, dragToPos as Vec3)}
            onClickState={(clickState) => {
              if (clickState === 3) this.onDragEnd(); // 3 = Clicked (release)
            }}
          />
        ))}

        {this.renderEdges(points, closed)}
        {showLive && reticle ? this.renderLivePreview(points, reticle) : null}
      </ViroARScene>
    );
  }
}
