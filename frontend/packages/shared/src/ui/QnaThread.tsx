import React, { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { PreBidQuestion } from '../types';
import { Text } from './Text';
import { Icon } from './Icon';
import { Field } from './Field';
import { Button } from './Button';

/** A photo the client attaches to an answer (structural — matches app PickedPhoto). */
export interface AnswerPhoto {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

/**
 * Pre-bid Q&A thread. Read-only by default; pass `onAnswer` to let the client
 * answer questions inline (the client side). When a question has
 * `image_required`, an attach-photo control is shown (needs `pickPhoto`). Labels
 * come from the caller so the component stays i18n-agnostic.
 */
export function QnaThread({
  questions,
  onAnswer,
  answering,
  answerCta,
  answerPlaceholder,
  askedByLabel,
  pickPhoto,
  attachPhotoCta,
  photoRequiredLabel,
  onRemove,
  canRemove,
  photoRequiredLegend,
}: {
  questions: PreBidQuestion[];
  onAnswer?: (questionId: number, answer: string, photo?: AnswerPhoto) => void;
  answering?: boolean;
  answerCta?: string;
  answerPlaceholder?: string;
  askedByLabel?: (name?: string) => string;
  /** Opens the platform picker and resolves to one photo (or null if cancelled). */
  pickPhoto?: () => Promise<AnswerPhoto | null>;
  attachPhotoCta?: string;
  photoRequiredLabel?: string;
  /** Remove a question (provider side, own questions). */
  onRemove?: (questionId: number) => void;
  canRemove?: (q: PreBidQuestion) => boolean;
  /** Caption shown on questions that require a photo answer. */
  photoRequiredLegend?: string;
}) {
  const t = useTheme();
  if (!questions.length) return null;

  return (
    <View style={{ gap: 10 }}>
      {questions.map((q) => (
        <View key={q.id} style={{ backgroundColor: t.colors.surface2, borderRadius: 14, padding: 13, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'stretch' }}>
            <Icon name="chat" size={16} color={t.colors.ink3} />
            <View style={{ flex: 1 }}>
              {askedByLabel && (
                <Text variant="caption" weight="700" color={t.colors.ink3}>{askedByLabel(q.provider_name)}</Text>
              )}
              <Text weight="700" style={{ fontSize: 14, marginTop: askedByLabel ? 1 : 0 }}>{q.question}</Text>
              {q.image_required && photoRequiredLegend ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  <Icon name="camera" size={13} color={t.colors.ink3} />
                  <Text variant="caption" color={t.colors.ink3}>{photoRequiredLegend}</Text>
                </View>
              ) : null}
            </View>
            {onRemove && canRemove?.(q) && (
              <Pressable
                onPress={() => onRemove(q.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`remove-question-${q.id}`}
                style={{ justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch', paddingHorizontal: 6, marginVertical: -13, marginRight: -13, paddingRight: 13, width: 48 }}
              >
                <Icon name="close" size={22} color={t.colors.ink3} />
              </Pressable>
            )}
          </View>

          {q.answered ? (
            <View style={{ paddingLeft: 25, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <Icon name="check" size={15} color={t.colors.ok} />
                <Text style={{ flex: 1, fontSize: 13.5 }} color={t.colors.ink2}>{q.answer}</Text>
              </View>
              {q.answer_photos?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {q.answer_photos.map((url) => (
                    <Image key={url} source={{ uri: url }} style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: t.colors.line }} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : onAnswer ? (
            <AnswerInput
              imageRequired={!!q.image_required}
              loading={answering}
              cta={answerCta ?? 'Send'}
              placeholder={answerPlaceholder ?? ''}
              pickPhoto={pickPhoto}
              attachPhotoCta={attachPhotoCta ?? 'Add photo'}
              photoRequiredLabel={photoRequiredLabel}
              onSubmit={(v, photo) => onAnswer(q.id, v, photo)}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function AnswerInput({
  onSubmit,
  loading,
  cta,
  placeholder,
  imageRequired,
  pickPhoto,
  attachPhotoCta,
  photoRequiredLabel,
}: {
  onSubmit: (v: string, photo?: AnswerPhoto) => void;
  loading?: boolean;
  cta: string;
  placeholder: string;
  imageRequired?: boolean;
  pickPhoto?: () => Promise<AnswerPhoto | null>;
  attachPhotoCta: string;
  photoRequiredLabel?: string;
}) {
  const t = useTheme();
  const [value, setValue] = useState('');
  const [photo, setPhoto] = useState<AnswerPhoto | null>(null);

  const needsPhoto = !!imageRequired && !!pickPhoto;
  const canSubmit = value.trim().length > 0 && (!needsPhoto || !!photo);

  const attach = async () => {
    if (!pickPhoto) return;
    const picked = await pickPhoto();
    if (picked) setPhoto(picked);
  };

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(value.trim(), photo ?? undefined);
    setValue('');
    setPhoto(null);
  };

  return (
    <View style={{ paddingLeft: 25, gap: 8 }}>
      <Field value={value} onChangeText={setValue} placeholder={placeholder} />

      {needsPhoto ? (
        photo ? (
          <Pressable onPress={attach} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <Image source={{ uri: photo.uri }} style={{ width: 44, height: 44, borderRadius: 9, backgroundColor: t.colors.line }} />
            <Text variant="caption" color={t.colors.ink2} style={{ flex: 1 }}>{photo.fileName ?? attachPhotoCta}</Text>
            <Icon name="edit" size={15} color={t.colors.ink3} />
          </Pressable>
        ) : (
          <Button title={attachPhotoCta} size="sm" variant="soft" onPress={attach} left={<Icon name="camera" size={16} color={t.colors.accent} />} />
        )
      ) : null}

      {needsPhoto && !photo && photoRequiredLabel ? (
        <Text variant="caption" color={t.colors.ink3}>{photoRequiredLabel}</Text>
      ) : null}

      <Button title={cta} size="sm" full loading={loading} disabled={!canSubmit} onPress={submit} />
    </View>
  );
}
