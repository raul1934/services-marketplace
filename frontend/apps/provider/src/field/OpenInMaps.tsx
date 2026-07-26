import React, { useState } from 'react';
import { Image, Linking, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Row, Sheet, Text, useTheme } from '@chamafacil/shared';
import { getInstalledMapApps } from '../../modules/map-apps';

type MapApp = { id: string; name: string; probe: string; url: string; color: string; glyph: 'navigate' | 'location'; pkg?: string; icon?: string };

/**
 * One "open in a maps app" button that opens a bottom sheet of the map apps
 * available on the device to route to `address`. Detection uses canOpenURL;
 * on Android that needs the schemes/packages declared under <queries> (see
 * plugins/withMapQueries) — until a native rebuild picks that up, the sheet
 * falls back to the common apps rather than hiding installed ones.
 */
type Waypoint = { lat: number; lng: number };

/**
 * Opens directions in a maps app. Pass `waypoints` (ordered route stops) to send
 * the whole route — only Google Maps supports multi-stop via URL, so it gets
 * every waypoint. Waze/Apple can't take a multi-stop route by URL, so they get
 * `primary` (the next stop) — falling back to the last waypoint. For a single
 * place, pass `address`.
 */
export function OpenInMaps({ address, waypoints, primary }: { address?: string; waypoints?: Waypoint[]; primary?: Waypoint }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<MapApp[]>([]);
  const route = waypoints && waypoints.length > 0 ? waypoints : null;

  const urlFor = (id: 'waze' | 'gmaps' | 'apple'): string => {
    if (route) {
      if (id === 'gmaps') {
        const dest = route[route.length - 1];
        const wp = route.slice(0, -1).map((p) => `${p.lat},${p.lng}`).join('|');
        return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}${wp ? `&waypoints=${encodeURIComponent(wp)}` : ''}&travelmode=driving`;
      }
      const one = primary ?? route[route.length - 1]; // Waze/Apple: single destination
      return id === 'waze' ? `https://waze.com/ul?ll=${one.lat},${one.lng}&navigate=yes` : `http://maps.apple.com/?daddr=${one.lat},${one.lng}`;
    }
    const q = encodeURIComponent(address ?? '');
    if (id === 'gmaps') return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    return id === 'waze' ? `https://waze.com/ul?q=${q}&navigate=yes` : `http://maps.apple.com/?daddr=${q}`;
  };

  const ALL: MapApp[] = [
    { id: 'waze', name: 'Waze', probe: 'waze://', url: urlFor('waze'), color: '#33ccff', glyph: 'navigate', pkg: 'com.waze' },
    { id: 'gmaps', name: 'Google Maps', probe: Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:0,0', url: urlFor('gmaps'), color: '#34a853', glyph: 'location', pkg: 'com.google.android.apps.maps' },
    ...(Platform.OS === 'ios' ? [{ id: 'apple', name: 'Apple Maps', probe: 'maps://', url: urlFor('apple'), color: t.colors.accent, glyph: 'location' } as MapApp] : []),
  ];

  const openSheet = async () => {
    // Android: the native module reports which map apps are installed and hands
    // back each one's real launcher icon — so we show only installed apps.
    if (Platform.OS === 'android') {
      const byPkg = new Map(getInstalledMapApps(ALL.filter((a) => a.pkg).map((a) => a.pkg!)).map((i) => [i.package, i.icon]));
      const found = ALL.filter((a) => a.pkg && byPkg.has(a.pkg)).map((a) => ({ ...a, icon: byPkg.get(a.pkg!) }));
      setApps(found.length ? found : ALL); // fall back if the module is unavailable
      setOpen(true);
      return;
    }

    // iOS: canOpenURL against the URL schemes.
    const found: MapApp[] = [];
    for (const a of ALL) {
      try {
        if (await Linking.canOpenURL(a.probe)) found.push(a);
      } catch {
        /* treat as unknown */
      }
    }
    setApps(found.length ? found : ALL);
    setOpen(true);
  };

  const go = (a: MapApp) => {
    setOpen(false);
    Linking.openURL(a.url).catch(() => {});
  };

  return (
    <>
      <Button title={tr('field.openInMaps')} variant="soft" full left={<Icon name="navigate" size={16} color={t.colors.accent} />} onPress={openSheet} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('field.openInMaps')} closeLabel={tr('common.close')}>
        <View style={{ gap: 8 }}>
          {apps.map((a) => (
            <Pressable
              key={a.id}
              accessibilityRole="button"
              accessibilityLabel={a.name}
              onPress={() => go(a)}
              style={{ backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, padding: 14 }}
            >
              <Row gap={12} style={{ alignItems: 'center' }}>
                {a.icon ? (
                  <Image source={{ uri: a.icon }} style={{ width: 32, height: 32, borderRadius: 9 }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={a.glyph} size={18} color="#fff" />
                  </View>
                )}
                <Text weight="700" style={{ flex: 1, fontSize: 14.5 }}>{a.name}</Text>
                <Icon name="arrowR" size={18} color={t.colors.ink3} />
              </Row>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </>
  );
}
