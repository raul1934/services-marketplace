import React, { useState } from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Row, Sheet, Text, useTheme } from '@chamafacil/shared';

type MapApp = { id: string; name: string; probe: string; url: string; color: string };

/**
 * One "open in a maps app" button that opens a bottom sheet of the map apps
 * available on the device to route to `address`. Detection uses canOpenURL;
 * on Android that needs the schemes/packages declared under <queries> (see
 * plugins/withMapQueries) — until a native rebuild picks that up, the sheet
 * falls back to the common apps rather than hiding installed ones.
 */
export function OpenInMaps({ address }: { address: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<MapApp[]>([]);
  const q = encodeURIComponent(address);

  const ALL: MapApp[] = [
    { id: 'waze', name: 'Waze', probe: 'waze://', url: `https://waze.com/ul?q=${q}&navigate=yes`, color: '#33ccff' },
    { id: 'gmaps', name: 'Google Maps', probe: Platform.OS === 'ios' ? 'comgooglemaps://' : 'geo:0,0', url: `https://www.google.com/maps/dir/?api=1&destination=${q}`, color: '#34a853' },
    ...(Platform.OS === 'ios' ? [{ id: 'apple', name: 'Apple Maps', probe: 'maps://', url: `http://maps.apple.com/?daddr=${q}`, color: t.colors.accent } as MapApp] : []),
  ];

  const openSheet = async () => {
    const found: MapApp[] = [];
    for (const a of ALL) {
      try {
        if (await Linking.canOpenURL(a.probe)) found.push(a);
      } catch {
        /* canOpenURL rejects on some Android versions — treat as unknown */
      }
    }
    // Fall back to the full list when detection is blocked (Android package
    // visibility), so the sheet is never mysteriously empty or missing an app.
    setApps(found.length >= ALL.length ? found : ALL);
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
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: a.color }} />
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
