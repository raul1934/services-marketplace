/**
 * NATIVE (iOS/Android) implementation of the `react-native-maps` API subset the
 * app uses, backed by **Leaflet inside a react-native-webview** + OpenStreetMap
 * (CARTO) tiles — no Google Maps, no API key, no billing.
 *
 * Aliased for native platforms in each app's metro.config.js (web keeps its own
 * DOM Leaflet stub in src/web-stubs). `MapView` is a class (like the real
 * react-native-maps) so screens can `useRef<MapView>()` and call the imperative
 * methods `animateToRegion` / `animateCamera`; the class delegates to an inner
 * function component that owns the WebView + Leaflet bridge.
 *
 * API covered:
 *   <MapView initialRegion|region onPress onRegionChangeComplete ref>
 *     <Marker coordinate pinColor title description draggable onDrag onDragEnd
 *             onPress onCalloutPress> {label child | RequestMarker child} </Marker>
 *     <Polygon coordinates strokeColor fillColor strokeWidth fillOpacity/>
 *     <Polyline coordinates strokeColor strokeWidth/>
 *   </MapView>
 *
 * Layers are serialised from JSX children and reconciled by a stable id (React
 * `key`, else child index). A marker being dragged is not repositioned from React
 * state mid-drag (Leaflet owns it), so the geofence editor's live drag works.
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
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
  onRegionChangeComplete?: (region: Region) => void;
  /** When false, the map won't pan on drag — so it doesn't swallow the parent
   *  ScrollView's vertical scroll. Tap-to-place and marker drag still work. */
  scrollEnabled?: boolean;
}

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function zoomFor(delta?: number): number {
  if (!delta || delta <= 0) return 13;
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / delta))));
}

const labelOf = (p: MarkerLike): { text: string; tone?: string } | null => {
  const c = p.children;
  if (!React.isValidElement(c)) return null;
  const lp = c.props as { text?: string; tone?: string };
  return lp.text != null ? { text: lp.text, tone: lp.tone } : null;
};
const richOf = (p: MarkerLike): { color: string; label: string; iconName: string } | null => {
  const c = p.children;
  if (!React.isValidElement(c)) return null;
  const lp = c.props as { color?: string; label?: string; iconName?: string };
  return lp.color && lp.iconName ? { color: lp.color, label: lp.label ?? '', iconName: lp.iconName } : null;
};

interface Layer {
  id: string;
  kind: 'pin' | 'circle' | 'label' | 'rich' | 'polygon' | 'polyline';
  coord?: [number, number];
  coords?: [number, number][];
  color?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  draggable?: boolean;
  title?: string;
  description?: string;
  label?: { text: string; tone?: string };
  rich?: { color: string; label: string };
  press?: boolean;
  callout?: boolean;
}

function serialize(children: React.ReactNode): Layer[] {
  const out: Layer[] = [];
  React.Children.forEach(children, (child, i) => {
    if (!React.isValidElement(child)) return;
    const p = child.props as MarkerLike;
    const id = child.key != null ? String(child.key) : 'i' + i;
    const isLine = child.type === Polyline;
    if (Array.isArray(p.coordinates)) {
      if (p.coordinates.length < 2) return;
      out.push({
        id,
        kind: isLine ? 'polyline' : 'polygon',
        coords: p.coordinates.map((c) => [c.latitude, c.longitude] as [number, number]),
        color: p.strokeColor,
        fillColor: p.fillColor,
        strokeWidth: p.strokeWidth,
        fillOpacity: p.fillOpacity,
      });
      return;
    }
    if (!p.coordinate) return;
    const coord: [number, number] = [p.coordinate.latitude, p.coordinate.longitude];
    const lbl = labelOf(p);
    if (lbl) {
      out.push({ id, kind: 'label', coord, label: lbl });
      return;
    }
    const rich = richOf(p);
    if (rich) {
      out.push({ id, kind: 'rich', coord, color: rich.color, rich, press: !!p.onPress });
      return;
    }
    out.push({
      id,
      kind: p.draggable ? 'pin' : 'circle',
      coord,
      color: p.pinColor,
      draggable: p.draggable,
      title: p.title,
      description: p.description,
      press: !!p.onPress,
      callout: !!p.onCalloutPress,
    });
  });
  return out;
}

/** The HTML document rendered inside the WebView: Leaflet from CDN + a bridge. */
function htmlDoc(center: [number, number], zoom: number, dark: boolean, accent: string, dragEnabled = true): string {
  const tiles = dark ? DARK_TILES : LIGHT_TILES;
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:${dark ? '#0e141d' : '#eef1f4'}}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var ACCENT=${JSON.stringify(accent)};
var post=function(o){try{window.ReactNativeWebView.postMessage(JSON.stringify(o));}catch(e){}};
var map=L.map('map',{attributionControl:false,zoomControl:true,maxZoom:18,dragging:${dragEnabled ? 'true' : 'false'}}).setView([${center[0]},${center[1]}],${zoom});
var tile=L.tileLayer(${JSON.stringify(tiles)},{subdomains:'abcd',maxZoom:19}).addTo(map);
map.on('click',function(e){post({t:'press',lat:e.latlng.lat,lng:e.latlng.lng});});
map.on('moveend',function(){var c=map.getCenter(),b=map.getBounds();post({t:'region',lat:c.lat,lng:c.lng,latD:b.getNorth()-b.getSouth(),lngD:b.getEast()-b.getWest()});});
var layers={}; var dragging={};
function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
function pinIcon(color){var d=18;return L.divIcon({className:'',html:'<div style="box-sizing:border-box;width:'+d+'px;height:'+d+'px;border-radius:9px;background:'+color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',iconSize:[d,d],iconAnchor:[9,9]});}
function labelIcon(text,tone){var area=tone==='area';var skin=area?('background:'+ACCENT+';color:#fff;'):'background:rgba(255,255,255,0.92);color:#222;border:1px solid rgba(0,0,0,0.08);';return L.divIcon({className:'',html:'<div style="transform:translate(-50%,-50%);white-space:nowrap;'+skin+'font:700 '+(area?12:11)+'px system-ui,sans-serif;padding:2px 6px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.25);">'+esc(text)+'</div>',iconSize:[0,0]});}
function richIcon(color,label){var lab=label?('<div style="background:#fff;border:1px solid '+color+';border-radius:8px;padding:1px 6px;margin-top:2px;"><span style="color:'+color+';font-weight:800;font-size:11px;font-family:system-ui,sans-serif;">'+esc(label)+'</span></div>'):'';return L.divIcon({className:'',html:'<div style="transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;white-space:nowrap;"><div style="width:32px;height:32px;border-radius:16px;background:#fff;border:2px solid '+color+';display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);"><div style="width:12px;height:12px;border-radius:6px;background:'+color+';"></div></div>'+lab+'</div>',iconSize:[0,0]});}
function setTiles(d){map.removeLayer(tile);tile=L.tileLayer(d?${JSON.stringify(DARK_TILES)}:${JSON.stringify(LIGHT_TILES)},{subdomains:'abcd',maxZoom:19}).addTo(map);}
function styleOf(d){if(d.kind==='polygon')return {color:d.color||ACCENT,weight:d.strokeWidth||2,fillColor:d.fillColor||d.color||ACCENT,fillOpacity:d.fillOpacity==null?1:d.fillOpacity};if(d.kind==='polyline')return {color:d.color||ACCENT,weight:d.strokeWidth||5,opacity:0.9};return null;}
function makeLayer(d){
  var color=d.color||ACCENT;
  if(d.kind==='polygon')return L.polygon(d.coords,styleOf(d));
  if(d.kind==='polyline')return L.polyline(d.coords,styleOf(d));
  if(d.kind==='label')return L.marker(d.coord,{icon:labelIcon(d.label.text,d.label.tone),interactive:false});
  if(d.kind==='rich'){var rm=L.marker(d.coord,{icon:richIcon(color,d.rich?d.rich.label:'')});if(d.press)rm.on('click',function(){post({t:'markerPress',id:d.id});});return rm;}
  if(d.kind==='pin'){
    var mk=L.marker(d.coord,{draggable:!!d.draggable,icon:pinIcon(color)});
    if(d.draggable){
      mk.on('dragstart',function(){dragging[d.id]=true;});
      mk.on('drag',function(){var p=mk.getLatLng();post({t:'drag',id:d.id,lat:p.lat,lng:p.lng});});
      mk.on('dragend',function(){dragging[d.id]=false;var p=mk.getLatLng();post({t:'dragEnd',id:d.id,lat:p.lat,lng:p.lng});});
    }
    if(d.press)mk.on('click',function(){post({t:'markerPress',id:d.id});});
    return mk;
  }
  var cm=L.circleMarker(d.coord,{color:'#fff',weight:2,fillColor:color,fillOpacity:1,radius:9});
  if(d.press)cm.on('click',function(){post({t:'markerPress',id:d.id});});
  if(d.title)cm.bindPopup('<b>'+esc(d.title)+'</b>'+(d.description?('<br/>'+esc(d.description)):''));
  if(d.callout)cm.on('popupopen',function(){var n=cm.getPopup().getElement();if(n)n.addEventListener('click',function(){post({t:'callout',id:d.id});},{once:true});});
  return cm;
}
function setLayers(list){
  var seen={};
  for(var i=0;i<list.length;i++){(function(d){
    seen[d.id]=true;
    var ex=layers[d.id];
    if(ex&&ex.kind!==d.kind){map.removeLayer(ex.layer);delete layers[d.id];ex=null;}
    if(!ex){layers[d.id]={kind:d.kind,layer:makeLayer(d).addTo(map)};return;}
    var lyr=ex.layer;
    if(d.kind==='polygon'||d.kind==='polyline'){lyr.setLatLngs(d.coords);var s=styleOf(d);if(s)lyr.setStyle(s);return;}
    if(d.kind==='label'){lyr.setLatLng(d.coord);lyr.setIcon(labelIcon(d.label.text,d.label.tone));return;}
    if(d.kind==='rich'){if(!dragging[d.id])lyr.setLatLng(d.coord);lyr.setIcon(richIcon(d.color||ACCENT,d.rich?d.rich.label:''));return;}
    if(!dragging[d.id])lyr.setLatLng(d.coord);
  })(list[i]);}
  for(var id in layers){if(!seen[id]){map.removeLayer(layers[id].layer);delete layers[id];}}
}
function onCmd(raw){try{var m=JSON.parse(raw);
  if(m.cmd==='layers')setLayers(m.list);
  else if(m.cmd==='view')map.setView([m.lat,m.lng],m.zoom);
  else if(m.cmd==='fly')map.flyTo([m.lat,m.lng],m.zoom,{duration:(m.duration||300)/1000});
  else if(m.cmd==='pan')map.panTo([m.lat,m.lng],{animate:true,duration:(m.duration||300)/1000});
  else if(m.cmd==='tiles')setTiles(m.dark);
}catch(e){}}
document.addEventListener('message',function(e){onCmd(e.data);});
window.addEventListener('message',function(e){onCmd(e.data);});
post({t:'ready'});
setTimeout(function(){map.invalidateSize();},50);
</script></body></html>`;
}

/** Inner function component: owns the WebView, syncs children/region, bridges events. */
function MapViewInner(props: MapViewProps & { handleRef: React.Ref<MapViewHandle> }) {
  const t = useTheme();
  const ref = React.useRef<WebView>(null);
  const ready = React.useRef(false);
  const start = props.region ?? props.initialRegion ?? { latitude: -23.56, longitude: -46.64, latitudeDelta: 0.05, longitudeDelta: 0.05 };

  const byId = React.useMemo(() => {
    const map = new Map<string, MarkerLike>();
    React.Children.forEach(props.children, (child, i) => {
      if (!React.isValidElement(child)) return;
      map.set(child.key != null ? String(child.key) : 'i' + i, child.props as MarkerLike);
    });
    return map;
  }, [props.children]);

  const html = React.useMemo(
    () => htmlDoc([start.latitude, start.longitude], zoomFor(start.latitudeDelta), t.dark, t.colors.accent, props.scrollEnabled !== false),
    // Rebuild only when theme flips or panning is toggled; region/children sync
    // via injection below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t.dark, props.scrollEnabled],
  );

  const send = React.useCallback((obj: unknown) => {
    ref.current?.injectJavaScript(`window.onCmd(${JSON.stringify(JSON.stringify(obj))});true;`);
  }, []);

  React.useImperativeHandle(props.handleRef, () => ({
    animateToRegion: (r: Region, durationMs = 300) =>
      send({ cmd: 'fly', lat: r.latitude, lng: r.longitude, zoom: zoomFor(r.latitudeDelta), duration: durationMs }),
    animateCamera: (camera, opts) => {
      if (camera.center) send({ cmd: 'pan', lat: camera.center.latitude, lng: camera.center.longitude, duration: opts?.duration });
    },
  }), [send]);

  const layers = React.useMemo(() => serialize(props.children), [props.children]);
  React.useEffect(() => {
    if (ready.current) send({ cmd: 'layers', list: layers });
  }, [layers, send]);

  React.useEffect(() => {
    if (ready.current && props.region)
      send({ cmd: 'view', lat: props.region.latitude, lng: props.region.longitude, zoom: zoomFor(props.region.latitudeDelta) });
  }, [props.region?.latitude, props.region?.longitude, props.region?.latitudeDelta, send]);

  const onMessage = React.useCallback(
    (e: WebViewMessageEvent) => {
      let m: { t: string; id?: string; lat?: number; lng?: number; latD?: number; lngD?: number };
      try {
        m = JSON.parse(e.nativeEvent.data);
      } catch {
        return;
      }
      if (m.t === 'ready') {
        ready.current = true;
        send({ cmd: 'layers', list: serialize(props.children) });
        return;
      }
      if (m.t === 'press') return props.onPress?.({ nativeEvent: { coordinate: { latitude: m.lat!, longitude: m.lng! } } });
      if (m.t === 'region')
        return props.onRegionChangeComplete?.({ latitude: m.lat!, longitude: m.lng!, latitudeDelta: m.latD!, longitudeDelta: m.lngD! });
      const p = m.id != null ? byId.get(String(m.id)) : undefined;
      if (!p) return;
      const ev = { nativeEvent: { coordinate: { latitude: m.lat!, longitude: m.lng! } } };
      if (m.t === 'drag') p.onDrag?.(ev);
      else if (m.t === 'dragEnd') p.onDragEnd?.(ev);
      else if (m.t === 'markerPress') p.onPress?.();
      else if (m.t === 'callout') p.onCalloutPress?.();
    },
    [byId, props, send],
  );

  const flat = (StyleSheet.flatten(props.style) as ViewStyle) ?? {};
  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html }}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      nestedScrollEnabled
      style={[{ backgroundColor: 'transparent', minHeight: 220 }, flat]}
    />
  );
}

/**
 * Class wrapper so `MapView` is usable as a type (`useRef<MapView>()`) and exposes
 * the imperative methods, matching react-native-maps. Delegates to MapViewInner.
 */
export default class MapView extends React.Component<MapViewProps> {
  private inner = React.createRef<MapViewHandle>();
  animateToRegion(region: Region, durationMs?: number) {
    this.inner.current?.animateToRegion(region, durationMs);
  }
  animateCamera(camera: { center?: { latitude: number; longitude: number } }, opts?: { duration?: number }) {
    this.inner.current?.animateCamera(camera, opts);
  }
  render() {
    return <MapViewInner {...this.props} handleRef={this.inner} />;
  }
}

// Prop-carrier components (read by MapView via React.Children; never rendered
// on their own) — mirror the react-native-maps + web-stub API.
export function Marker(_props: MarkerLike & { anchor?: { x: number; y: number } }) {
  return null;
}
export function Polygon(_props: {
  coordinates: LatLng[];
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
}) {
  return null;
}
export function Polyline(_props: {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  lineDashPattern?: number[];
}) {
  return null;
}
