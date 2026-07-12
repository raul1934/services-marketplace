import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Alert } from '@chamafacil/shared';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar,
  AvailabilityType,
  AvailabilityWindow,
  Button,
  Card,
  Field,
  Screen,
  Segment,
  Text,
  WEEKDAYS,
  Weekday,
  useAuth,
  useTheme,
} from '@chamafacil/shared';
import { useAvailability, useCategories, useSetAvailability, useSetCategories } from '../src/queries';
import { CatRow } from '../src/components/CatRow';

export default function Config() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { user, refresh } = useAuth();
  const { data: categories } = useCategories();
  const setCategories = useSetCategories();
  const availability = useAvailability();
  const setAvailability = useSetAvailability();

  const [selected, setSelected] = useState<number[]>(user?.categories?.map((c) => c.id) ?? []);
  const [availType, setAvailType] = useState<AvailabilityType>(AvailabilityType.Always);
  const [windows, setWindows] = useState<Record<string, AvailabilityWindow>>({});

  useEffect(() => {
    if (availability.data) {
      setAvailType((availability.data.availability_type as AvailabilityType) ?? AvailabilityType.Always);
      const map: Record<string, AvailabilityWindow> = {};
      for (const w of availability.data.windows) map[w.weekday] = w;
      setWindows(map);
    }
  }, [availability.data]);

  const toggleCat = (id: number) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const toggleDay = (day: Weekday) =>
    setWindows((cur) => {
      const next = { ...cur };
      if (next[day]) delete next[day];
      else next[day] = { weekday: day, start_time: '08:00', end_time: '18:00' };
      return next;
    });

  const setTime = (day: Weekday, field: 'start_time' | 'end_time', value: string) =>
    setWindows((cur) => ({ ...cur, [day]: { ...cur[day], [field]: value } }));

  const saveCategories = async () => {
    try {
      await setCategories.mutateAsync(selected);
      await refresh();
      Alert.alert(tr('common.saved'), tr('config.servicesSaved'));
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const saveAvailability = async () => {
    try {
      await setAvailability.mutateAsync({
        type: availType,
        windows: availType === AvailabilityType.Scheduled ? Object.values(windows) : [],
      });
      Alert.alert(tr('common.saved'), tr('config.availabilitySaved'));
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  return (
    <Screen stickyHeader>
      <BackBar title={tr('config.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />

      <Text variant="label" style={{ marginBottom: 10 }}>
        {tr('config.servicesLabel')}
      </Text>
      <View style={{ gap: 10, marginBottom: 12 }}>
        {categories?.map((c) => (
          <CatRow key={c.id} category={c} selected={selected.includes(c.id)} onPress={() => toggleCat(c.id)} />
        ))}
      </View>
      <Button title={tr('config.saveServices')} variant="soft" full loading={setCategories.isPending} onPress={saveCategories} />

      <Text variant="label" style={{ marginTop: 28, marginBottom: 10 }}>
        {tr('config.availabilityLabel')}
      </Text>
      {availability.isLoading ? (
        <ActivityIndicator color={t.colors.accent} />
      ) : (
        <View style={{ gap: 14 }}>
          <Segment
            items={[
              { value: AvailabilityType.Always, label: tr('enums.availabilityType.always') },
              { value: AvailabilityType.Scheduled, label: tr('enums.availabilityType.scheduled') },
            ]}
            value={availType}
            onChange={setAvailType}
          />

          {availType === AvailabilityType.Scheduled && (
            <View style={{ gap: 8 }}>
              {WEEKDAYS.map((day) => {
                const w = windows[day];
                return (
                  <Card key={day} flat style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Pressable onPress={() => toggleDay(day)} style={{ width: 44 }}>
                      <Text variant="label" color={w ? t.colors.accent : t.colors.ink3}>
                        {tr(`enums.weekdayShort.${day}`)}
                      </Text>
                    </Pressable>
                    {w ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={{ flex: 1 }}>
                          <Field value={w.start_time} onChangeText={(v) => setTime(day, 'start_time', v)} placeholder="08:00" />
                        </View>
                        <Text variant="caption">{tr('common.until')}</Text>
                        <View style={{ flex: 1 }}>
                          <Field value={w.end_time} onChangeText={(v) => setTime(day, 'end_time', v)} placeholder="18:00" />
                        </View>
                      </View>
                    ) : (
                      <Text variant="caption" style={{ flex: 1 }}>
                        {tr('config.dayOff')}
                      </Text>
                    )}
                  </Card>
                );
              })}
            </View>
          )}

          <Button title={tr('config.saveAvailability')} full loading={setAvailability.isPending} onPress={saveAvailability} />
        </View>
      )}
    </Screen>
  );
}
