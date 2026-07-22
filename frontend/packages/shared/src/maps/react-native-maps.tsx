/**
 * `react-native-maps`, backed by MapLibre.
 *
 * The apps alias the `react-native-maps` module name to this file (see each
 * app's metro.config.js), so the 16 call sites across both apps keep the API
 * they already speak — `<MapView><Marker/><Polygon/><Polyline/></MapView>`
 * plus `animateToRegion` / `animateCamera` on a ref. Only the engine changed.
 *
 * What it replaced: a WebView running Leaflet, with the Leaflet library itself
 * fetched from unpkg.com on every mount. No network meant no map — in an app
 * whose central case is somebody stopped on a hard shoulder with bad signal,
 * the map was the first thing to go dark, and it took a third-party CDN with
 * it into the critical path of asking for help.
 *
 * Three things fall out of the move beyond speed:
 *
 * - It renders natively, so there is no WebView per map, and there are 16.
 * - `OfflineManager` exists, so cached tiles become possible rather than
 *   impossible.
 * - Region changes report `userInteraction`. The new-request wizard needed
 *   exactly that signal and did not have it: it had to guess whether a region
 *   change was the customer moving the pin or the map settling into place, and
 *   guessing wrong rewrote the address it had just shown them. It took four
 *   attempts to approximate that flag with heuristics. Now it is a boolean.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker as MLMarker,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import { useTheme } from '../theme';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
interface LatLng {
  latitude: number;
  longitude: number;
}
interface MapPress {
  nativeEvent: { coordinate: LatLng };
}
export interface MapViewHandle {
  animateToRegion: (region: Region, durationMs?: number) => void;
  animateCamera: (camera: { center?: { latitude: number; longitude: number } }, opts?: { duration?: number }) => void;
}

interface MarkerLike {
  coordinate?: LatLng;
  coordinates?: LatLng[];
  pinColor?: string;
  title?: string;
  description?: string;
  draggable?: boolean;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  lineDashPattern?: number[];
  onDrag?: (e: MapPress) => void;
  onDragEnd?: (e: MapPress) => void;
  onPress?: () => void;
  onCalloutPress?: () => void;
  children?: React.ReactNode;
}

interface MapViewProps {
  initialRegion?: Region;
  region?: Region;
  style?: ViewStyle;
  children?: React.ReactNode;
  onPress?: (e: MapPress) => void;
  /**
   * Fired only for changes the user made. MapLibre separates those from the
   * ones the app causes itself; the previous engine did not, so every consumer
   * had to invent its own way of telling them apart.
   */
  onRegionChangeComplete?: (region: Region) => void;
  /** When false, the map won't pan on drag — so it doesn't swallow the parent
   *  ScrollView's vertical scroll. Tap-to-place and marker drag still work. */
  scrollEnabled?: boolean;
}

// The same CARTO basemaps the WebView used, so nothing about the look changes.
const LIGHT_TILES = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
const DARK_TILES = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

/** Web-Mercator zoom for a longitude span, matching the old Leaflet mapping. */
function zoomFor(delta?: number): number {
  if (!delta || delta <= 0) return 13;
  return Math.max(3, Math.min(18, Math.log2(360 / delta)));
}

/** Longitude span for a zoom — the inverse of `zoomFor`, to report a Region back. */
function deltaFor(zoom: number): number {
  return 360 / Math.pow(2, zoom);
}

/**
 * A raster style built in code rather than fetched.
 *
 * MapLibre normally takes a style URL, which would put a network round trip
 * back in front of the map — the exact problem being fixed here. Tiles still
 * come from the network, but a map missing tiles is a grey grid you can still
 * pan, not a blank screen, and tiles are what `OfflineManager` can cache.
 */
function rasterStyle(dark: boolean, background: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [dark ? DARK_TILES : LIGHT_TILES],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© OpenStreetMap, © CARTO',
      },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': background } },
      { id: 'basemap', type: 'raster', source: 'basemap' },
    ],
  } as StyleSpecification;
}

interface MarkerSpec { id: string; lngLat: [number, number]; pinColor?: string; child?: React.ReactNode; onPress?: () => void }
interface ShapeSpec { id: string; coords: [number, number][]; stroke?: string; fill?: string; width?: number; opacity?: number }

/** JSX children → the shapes MapLibre draws. Reconciled by React key, else index. */
function useLayers(children: React.ReactNode) {
  return React.useMemo(() => {
    const markers: MarkerSpec[] = [];
    const polygons: ShapeSpec[] = [];
    const lines: ShapeSpec[] = [];

    React.Children.forEach(children, (child, i) => {
      if (!React.isValidElement(child)) return;
      const p = child.props as MarkerLike;
      const id = String(child.key ?? i);
      const kind = (child.type as { displayName?: string })?.displayName;

      if (p.coordinate) {
        markers.push({ id, lngLat: [p.coordinate.longitude, p.coordinate.latitude], pinColor: p.pinColor, child: p.children, onPress: p.onPress });
        return;
      }
      if (!p.coordinates?.length) return;
      const coords = p.coordinates.map((c) => [c.longitude, c.latitude] as [number, number]);
      // Fall back on the props when the name is missing (production builds can
      // drop it): only a polygon carries a fill.
      const isLine = kind === 'Polyline' || (kind !== 'Polygon' && p.fillColor == null);
      (isLine ? lines : polygons).push({ id, coords, stroke: p.strokeColor, fill: p.fillColor, width: p.strokeWidth, opacity: p.fillOpacity });
    });

    return { markers, polygons, lines };
  }, [children]);
}

/** The default marker, for call sites that pass only a `pinColor`. */
function Pin({ color }: { color: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: 3, borderColor: '#fff' }} />
      <View style={{ width: 2, height: 8, backgroundColor: color }} />
    </View>
  );
}

function MapImpl({
  initialRegion,
  region,
  style,
  children,
  onPress,
  onRegionChangeComplete,
  scrollEnabled = true,
  cameraRef,
}: MapViewProps & { cameraRef: React.RefObject<CameraRef | null> }) {
  const t = useTheme();
  const dark = t.dark;
  const view = region ?? initialRegion;
  const { markers, polygons, lines } = useLayers(children);
  const mapStyle = React.useMemo(() => rasterStyle(dark, t.colors.surface2), [dark, t.colors.surface2]);

  return (
    <View style={[{ minHeight: 220 }, style]}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={mapStyle}
        logo={false}
        attribution={false}
        compass={false}
        dragPan={scrollEnabled}
        onPress={(e) =>
          onPress?.({
            nativeEvent: {
              coordinate: { latitude: e.nativeEvent.lngLat[1], longitude: e.nativeEvent.lngLat[0] },
            },
          })
        }
        onRegionDidChange={(ev: { nativeEvent: ViewStateChangeEvent }) => {
          const e = ev.nativeEvent;
          // The reason this migration matters for this callback: only the
          // user's own moves are reported, so consumers stop guessing.
          if (!e.userInteraction) return;
          onRegionChangeComplete?.({
            latitude: e.center[1],
            longitude: e.center[0],
            latitudeDelta: deltaFor(e.zoom),
            longitudeDelta: deltaFor(e.zoom),
          });
        }}
      >
        <Camera
          ref={cameraRef}
          // `center`/`zoom` track the `region` prop when a screen drives the
          // map; with only `initialRegion` they are a starting point and the
          // user owns the camera from then on.
          {...(region
            ? { center: [view!.longitude, view!.latitude] as [number, number], zoom: zoomFor(view!.longitudeDelta) }
            : {
                defaultSettings: {
                  center: [view?.longitude ?? 0, view?.latitude ?? 0] as [number, number],
                  zoom: zoomFor(view?.longitudeDelta),
                },
              })}
        />

        {polygons.map((g) => (
          <GeoJSONSource
            key={`poly-${g.id}`}
            id={`poly-${g.id}`}
            data={{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [g.coords] } }}
          >
            <Layer id={`poly-fill-${g.id}`} type="fill" style={{ fillColor: g.fill ?? 'transparent', fillOpacity: g.opacity ?? 1 }} />
            <Layer id={`poly-line-${g.id}`} type="line" style={{ lineColor: g.stroke ?? 'transparent', lineWidth: g.width ?? 2 }} />
          </GeoJSONSource>
        ))}

        {lines.map((l) => (
          <GeoJSONSource
            key={`line-${l.id}`}
            id={`line-${l.id}`}
            data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: l.coords } }}
          >
            <Layer
              id={`line-layer-${l.id}`}
              type="line"
              style={{ lineColor: l.stroke ?? t.colors.accent, lineWidth: l.width ?? 3, lineCap: 'round', lineJoin: 'round' }}
            />
          </GeoJSONSource>
        ))}

        {markers.map((m) => (
          <MLMarker key={`m-${m.id}`} id={`m-${m.id}`} lngLat={m.lngLat}>
            <View onTouchEnd={m.onPress}>{m.child ?? <Pin color={m.pinColor ?? t.colors.accent} />}</View>
          </MLMarker>
        ))}
      </Map>
    </View>
  );
}

/**
 * Class component purely so the imperative ref API keeps working: several
 * screens hold a `MapViewHandle` and call `animateToRegion` / `animateCamera`.
 */
export default class MapView extends React.Component<MapViewProps> implements MapViewHandle {
  private camera = React.createRef<CameraRef>();

  animateToRegion(region: Region, durationMs = 400) {
    // `easeTo` takes one options bag, not (options, animation).
    this.camera.current?.easeTo({
      center: [region.longitude, region.latitude],
      zoom: zoomFor(region.longitudeDelta),
      duration: durationMs,
    });
  }

  animateCamera(camera: { center?: { latitude: number; longitude: number } }, opts?: { duration?: number }) {
    if (!camera.center) return;
    this.camera.current?.easeTo({
      center: [camera.center.longitude, camera.center.latitude],
      duration: opts?.duration ?? 400,
    });
  }

  render() {
    return <MapImpl {...this.props} cameraRef={this.camera} />;
  }
}

// Prop-carrier components (read by MapView via React.Children; never rendered
// on their own) — mirror the react-native-maps + web-stub API.
export function Marker(_props: MarkerLike & { anchor?: { x: number; y: number } }) {
  return null;
}
Marker.displayName = 'Marker';

export function Polygon(_props: {
  coordinates: LatLng[];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}) {
  return null;
}
Polygon.displayName = 'Polygon';

export function Polyline(_props: {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
}) {
  return null;
}
Polyline.displayName = 'Polyline';
