import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { SkeletonScreen, Alert } from '@chamafacil/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  BackBar, Badge, Button, Card, Field, Icon, Row, Screen, SectionLabel, Segment, Text, WarrantyClaim, WarrantyType, useTheme,
} from '@chamafacil/shared';
import { useWarrantyClaims, useOpenWarranty } from '../../../src/queries';
import { PickedPhoto, pickPhotos } from '../../../src/photos';

/** Matches the server's `media_ids` cap in WarrantyController. */
const MAX_PHOTOS = 5;

/** V3Garantia + V3GarantiaStatus (C41/C42): claim a redo/refund and track it. */
export default function WarrantyScreen() {
  const t = useTheme();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { data: claims, isLoading } = useWarrantyClaims(requestId) as { data?: WarrantyClaim[]; isLoading: boolean };
  const open = useOpenWarranty(requestId);

  const [type, setType] = useState<WarrantyType>('redo');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const addPhotos = async () => {
    const picked = await pickPhotos(MAX_PHOTOS - photos.length);
    if (picked.length) setPhotos((cur) => [...cur, ...picked].slice(0, MAX_PHOTOS));
  };

  if (isLoading) return <SkeletonScreen />;

  const hasClaims = !!claims?.length;
  // First claim → form is the point of the screen. With an existing claim, the
  // status is primary and the new-claim form is gated behind an explicit action.
  const formVisible = showForm || !hasClaims;

  const submit = () =>
    open.mutate(
      { type, description: description.trim() || undefined, photos },
      {
        onSuccess: () => {
          Alert.alert(tr('common.ok'), tr('actions.warranty.openedMsg'));
          setDescription('');
          setPhotos([]);
          setShowForm(false);
        },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );

  const footer = formVisible
    ? <Button title={tr('actions.warranty.submit')} full loading={open.isPending} onPress={submit} />
    : undefined;

  return (
    <Screen stickyHeader padded={false} footer={footer}>
      <BackBar title={tr('actions.warranty.title')} onBack={() => (router.canGoBack() ? router.back() : router.replace(`/request/${id}`))} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}>
        <Card flat style={{ gap: 6 }}>
          <Row gap={10}><Icon name="shieldCheck" size={20} color={t.colors.ok} /><Text weight="800" style={{ flex: 1, fontSize: 15 }}>{tr('actions.warranty.coverTitle')}</Text></Row>
          <Text variant="caption">{tr('actions.warranty.coverBody')}</Text>
        </Card>

        {hasClaims && (
          <View style={{ gap: 8 }}>
            <SectionLabel count={claims!.length}>{tr('actions.warranty.existing')}</SectionLabel>
            {claims!.map((c) => (
              <Card key={c.id} flat>
                <Row>
                  <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={c.type === 'redo' ? 'wrench' : 'cash'} size={18} color={t.colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text weight="700" style={{ fontSize: 14 }}>{tr(`actions.warranty.type.${c.type}`)}</Text>
                    {!!c.description && <Text variant="caption" numberOfLines={1}>{c.description}</Text>}
                  </View>
                  <Badge label={tr(`actions.warranty.status.${c.status}`)} tone={c.status === 'resolved' ? 'live' : 'open'} dot />
                </Row>
                {!!c.photos?.length && (
                  <Row gap={8} style={{ flexWrap: 'wrap', marginTop: 10 }}>
                    {c.photos.map((p) => (
                      <Image key={p.id} source={{ uri: p.url }} style={{ width: 64, height: 64, borderRadius: 10 }} />
                    ))}
                  </Row>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* With existing claims, opening another is a deliberate action, not the
            default — so the screen reads as "status" first. */}
        {hasClaims && !formVisible && (
          <Button title={tr('actions.warranty.openAnother')} variant="soft" full onPress={() => setShowForm(true)} left={<Icon name="plus" size={16} color={t.colors.accent} />} />
        )}

        {formVisible && (
          <>
            <SectionLabel>{tr('actions.warranty.newTitle')}</SectionLabel>
            <Segment
              items={[
                { value: 'redo', label: tr('actions.warranty.type.redo') },
                { value: 'refund', label: tr('actions.warranty.type.refund') },
              ]}
              value={type}
              onChange={(v) => setType(v as WarrantyType)}
            />
            <Field
              label={tr('actions.warranty.descLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={tr('actions.warranty.descPlaceholder')}
              multiline
              voiceInput
              style={{ height: 90, textAlignVertical: 'top' }}
            />

            {/* Ops triages these claims without having seen the job, so a photo
                of what went wrong is usually the case itself. */}
            <View style={{ gap: 8 }}>
              <SectionLabel count={photos.length || undefined}>{tr('actions.warranty.photosLabel')}</SectionLabel>
              <Text variant="caption" color={t.colors.ink3}>{tr('actions.warranty.photosHint')}</Text>

              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {photos.map((p, i) => (
                  <Pressable key={`${p.uri}-${i}`} onPress={() => setPhotos((cur) => cur.filter((_, j) => j !== i))}>
                    <Image source={{ uri: p.uri }} style={{ width: 76, height: 76, borderRadius: 12 }} />
                    <View
                      style={{
                        position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
                        backgroundColor: t.colors.danger, alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Icon name="close" size={12} color="#fff" />
                    </View>
                  </Pressable>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <Pressable
                    onPress={addPhotos}
                    style={{
                      width: 76, height: 76, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
                      borderColor: t.colors.line, alignItems: 'center', justifyContent: 'center', gap: 2,
                    }}
                  >
                    <Icon name="camera" size={20} color={t.colors.ink3} />
                    <Text variant="caption" color={t.colors.ink3} style={{ fontSize: 10 }}>
                      {MAX_PHOTOS - photos.length}
                    </Text>
                  </Pressable>
                )}
              </Row>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
