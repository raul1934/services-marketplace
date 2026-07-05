import React, { useState } from 'react';
import { View } from 'react-native';
import { Alert } from '@walvee/shared';
import { useTranslation } from 'react-i18next';
import { AvInit, Button, Card, Chip, Field, SectionLabel, Stars, Text, brl, useTheme } from '@walvee/shared';
import { useSubmitReview } from '../queries';

const TIP_OPTIONS = [0, 5, 10, 20];
const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/**
 * Rate-the-provider form for a completed job. Used inline on the request detail
 * (the completed state) and on the /rate route. After submit, the request is
 * refetched — `review` populates, so the inline host hides this form.
 */
export function ReviewForm({
  requestId,
  request,
  onSubmitted,
}: {
  requestId: number;
  request?: { provider?: { name?: string } | null; category?: { slug: string; name: string } | null; started_at?: string | null; completed_at?: string | null } | null;
  onSubmitted?: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const review = useSubmitReview(requestId);
  const tags = tr('rate.tags', { returnObjects: true }) as string[];
  const words = tr('rate.words', { returnObjects: true }) as string[];

  const [rating, setRating] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(0);

  const toggle = (tag: string) => setSelected((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  const elapsed = request?.started_at && request?.completed_at
    ? Math.max(1, Math.round((new Date(request.completed_at).getTime() - new Date(request.started_at).getTime()) / 60000))
    : null;

  const submit = () => {
    review.mutate(
      { rating, comment: comment.trim() || undefined, tags: selected, tip_amount: tip || undefined },
      {
        onSuccess: () => { Alert.alert(tr('common.thanks'), tr('rate.successBody')); onSubmitted?.(); },
        onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
      },
    );
  };

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ alignItems: 'center', gap: 12, paddingTop: 26, paddingBottom: 24 }}>
        <AvInit initials={initialsOf(request?.provider?.name ?? undefined)} color="#3b82f6" size={72} />
        <View style={{ alignItems: 'center' }}>
          <Text weight="800" style={{ fontSize: 18 }}>{request?.provider?.name ?? tr('requestDetail.fallbackProvider')}</Text>
          <Text variant="caption">
            {[request?.category && tr(`categories.${request.category.slug}`, { defaultValue: request.category.name }), elapsed ? tr('rate.completedIn', { min: elapsed }) : tr('rate.completed')].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Stars value={rating} size={36} onChange={setRating} />
        <Text weight="800" color={t.colors.accent} style={{ fontSize: 14 }}>{words[rating - 1]}</Text>
      </Card>

      <SectionLabel>{tr('rate.whatWentWell')}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} active={selected.includes(tag)} onPress={() => toggle(tag)} />
        ))}
      </View>

      <Field
        label={tr('rate.commentLabel')}
        value={comment}
        onChangeText={setComment}
        placeholder={tr('rate.commentPlaceholder')}
        multiline
        voiceInput
        numberOfLines={3}
        style={{ height: 70, textAlignVertical: 'top' }}
      />

      <SectionLabel>{tr('rate.addTip')}</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TIP_OPTIONS.map((amount) => {
          const on = tip === amount;
          return (
            <Text
              key={amount}
              onPress={() => setTip(amount)}
              weight="700"
              center
              color={on ? t.colors.accentInk : t.colors.ink2}
              style={{
                flex: 1,
                fontSize: 13,
                paddingVertical: 10,
                borderRadius: 999,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: on ? t.colors.accent : t.colors.line,
                backgroundColor: on ? t.colors.accent : t.colors.surface,
              }}
            >
              {amount === 0 ? tr('rate.noTip') : brl(amount)}
            </Text>
          );
        })}
      </View>

      <Button title={tr('rate.submit')} full loading={review.isPending} onPress={submit} style={{ marginTop: 4 }} />
    </View>
  );
}
