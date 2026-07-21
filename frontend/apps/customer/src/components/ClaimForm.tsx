import React, { ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Icon, Field, Row, SectionLabel, Text, useTheme } from '@chamafacil/shared';
import { PickedPhoto, pickPhotos } from '../photos';

/** Matches the server's photo cap on both the dispute and the warranty endpoints. */
export const MAX_CLAIM_PHOTOS = 5;

/**
 * "Open a case" form shared by dispute (C37) and warranty (C41): a free-text
 * account of what happened plus up to `maxPhotos` evidence photos. The two
 * screens differ only in labels and in what they do with the payload, so they
 * pass their own strings and keep ownership of the submit action — the picker,
 * the caps and the remove-a-photo affordance live here, once.
 */
export function ClaimForm({
  description,
  onChangeDescription,
  descriptionLabel,
  descriptionPlaceholder,
  descriptionHeight = 100,
  photosLabel,
  photosHint,
  photos,
  onChangePhotos,
  maxPhotos = MAX_CLAIM_PHOTOS,
  header,
  footer,
}: {
  description: string;
  onChangeDescription: (v: string) => void;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHeight?: number;
  photosLabel: string;
  photosHint?: string;
  photos: PickedPhoto[];
  onChangePhotos: (next: PickedPhoto[]) => void;
  maxPhotos?: number;
  /** Rendered above the description — e.g. the warranty redo/refund segment. */
  header?: ReactNode;
  /** Rendered below the photos — e.g. the dispute submit button + notice. */
  footer?: ReactNode;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  const addPhotos = async () => {
    try {
      const picked = await pickPhotos(maxPhotos - photos.length);
      if (picked.length) onChangePhotos([...photos, ...picked].slice(0, maxPhotos));
    } catch (e) {
      Alert.alert(tr('common.error'), (e as Error).message);
    }
  };

  const removePhoto = (index: number) => onChangePhotos(photos.filter((_, j) => j !== index));

  return (
    <>
      {header}

      <Field
        label={descriptionLabel}
        value={description}
        onChangeText={onChangeDescription}
        placeholder={descriptionPlaceholder}
        multiline
        voiceInput
        style={{ height: descriptionHeight, textAlignVertical: 'top' }}
      />

      {/* Ops triages these claims without having seen the job, so a photo of what
          went wrong is usually the case itself — and a wrong photo has to be
          removable before it becomes evidence. */}
      <View style={{ gap: 8 }}>
        <SectionLabel count={photos.length || undefined}>{photosLabel}</SectionLabel>
        {!!photosHint && <Text variant="caption" color={t.colors.ink3}>{photosHint}</Text>}

        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {photos.map((p, i) => (
            <Pressable key={`${p.uri}-${i}`} onPress={() => removePhoto(i)} accessibilityRole="button">
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

          {photos.length < maxPhotos && (
            <Pressable
              onPress={addPhotos}
              accessibilityRole="button"
              style={{
                width: 76, height: 76, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed',
                borderColor: t.colors.line, backgroundColor: t.colors.surface2,
                alignItems: 'center', justifyContent: 'center', gap: 2,
              }}
            >
              <Icon name="camera" size={20} color={t.colors.ink3} />
              <Text variant="caption" color={t.colors.ink3} style={{ fontSize: 10 }}>
                {maxPhotos - photos.length}
              </Text>
            </Pressable>
          )}
        </Row>
      </View>

      {footer}
    </>
  );
}
