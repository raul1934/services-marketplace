import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Chip, Field, Icon, Row, SectionLabel, Text, useTheme } from '@walvee/shared';
import { DatePicker } from './DatePicker';

export interface RecordKmPayload {
  mileage: number;
  note?: string;
  service_request_id?: number;
  recorded_at?: string;
}

/** Bottom sheet for the owner to record an odometer reading (km), optionally
 *  linked to one of the asset's services. */
export function RecordKmSheet({
  visible,
  onClose,
  onSubmit,
  loading,
  services = [],
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: RecordKmPayload) => void;
  loading?: boolean;
  services?: { id: number; label: string }[];
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [serviceId, setServiceId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>();

  const reset = () => {
    setKm('');
    setNote('');
    setDate('');
    setServiceId(undefined);
    setError(undefined);
  };

  const submit = () => {
    const value = parseInt(km.replace(/\D/g, ''), 10);
    if (!value || value <= 0) {
      setError(tr('assets.kmError'));
      return;
    }
    onSubmit({ mileage: value, note: note.trim() || undefined, service_request_id: serviceId, recorded_at: date || undefined });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation?.()}
          style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 16, maxHeight: '85%' }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.colors.line }} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="h3">{tr('assets.recordKm')}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
              <Icon name="close" size={22} color={t.colors.ink3} />
            </Pressable>
          </Row>

          <Field
            label={tr('assets.mileage')}
            value={km}
            onChangeText={(v) => { setKm(v); setError(undefined); }}
            placeholder={tr('assets.kmPlaceholder')}
            keyboardType="numeric"
            error={error}
          />
          <DatePicker label={tr('assets.kmDate')} value={date} onChange={setDate} placeholder={tr('assets.datePlaceholder')} disableFuture />
          <Field label={tr('assets.kmNote')} value={note} onChangeText={setNote} placeholder="" />

          {services.length > 0 ? (
            <View style={{ gap: 8 }}>
              <SectionLabel>{tr('assets.kmService')}</SectionLabel>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                {services.map((s) => (
                  <Chip key={s.id} label={s.label} active={serviceId === s.id} onPress={() => setServiceId(serviceId === s.id ? undefined : s.id)} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Button title={tr('assets.recordKm')} variant="grad" full loading={loading} onPress={submit} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
