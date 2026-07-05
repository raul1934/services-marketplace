import React, { useState } from 'react';
import { View } from 'react-native';
import { Alert } from '@walvee/shared';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AvInit, Button, Card, Chip, Field, Icon, Row, SectionLabel, Stars, Text, Toggle, useTheme } from '@walvee/shared';
import { providerApi } from '../api';
import { keys } from '../queries';

const initialsOf = (name?: string) => (name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/**
 * Rate-the-client form for a completed job. Used inline on the job screen (the
 * completed state) and on the /rate-client route. After submit the job is
 * refetched — `provider_review` populates, so the inline host hides this form.
 */
export function RateClientForm({
  requestId,
  request,
  onSubmitted,
}: {
  requestId: number;
  request?: { client?: { name?: string } | null; category?: { slug: string; name: string } | null } | null;
  onSubmitted?: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const tags = tr('rateClient.tags', { returnObjects: true }) as string[];
  const words = tr('rateClient.words', { returnObjects: true }) as string[];

  const [rating, setRating] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [preferred, setPreferred] = useState(true);

  const submit = useMutation({
    mutationFn: () => providerApi.rateClient(requestId, { rating, comment: note.trim() || undefined, tags: selected, preferred }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.job(requestId) });
      Alert.alert(tr('common.saved'), tr('rateClient.successBody'));
      onSubmitted?.();
    },
    onError: (e) => Alert.alert(tr('common.error'), (e as Error).message),
  });

  const toggle = (tag: string) => setSelected((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ alignItems: 'center', gap: 12, paddingTop: 26, paddingBottom: 24 }}>
        <AvInit initials={initialsOf(request?.client?.name ?? undefined)} color="#3b82f6" size={72} />
        <View style={{ alignItems: 'center' }}>
          <Text weight="800" style={{ fontSize: 18 }}>{request?.client?.name ?? '—'}</Text>
          <Text variant="caption">{request?.category && tr(`categories.${request.category.slug}`, { defaultValue: request.category.name })}</Text>
        </View>
        <Stars value={rating} size={36} onChange={setRating} />
        <Text weight="800" color={t.colors.accent} style={{ fontSize: 14 }}>{words[rating - 1]}</Text>
      </Card>

      <SectionLabel>{tr('rateClient.whatStoodOut')}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} active={selected.includes(tag)} onPress={() => toggle(tag)} />
        ))}
      </View>

      <Field
        label={tr('rateClient.noteLabel')}
        value={note}
        onChangeText={setNote}
        placeholder={tr('rateClient.notePlaceholder')}
        multiline
        voiceInput
        numberOfLines={3}
        style={{ height: 70, textAlignVertical: 'top' }}
      />

      <Card flat onPress={() => setPreferred((p) => !p)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="heart" size={20} color={t.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="700" style={{ fontSize: 14 }}>{tr('rateClient.preferredTitle')}</Text>
          <Text variant="caption">{tr('rateClient.preferredBody')}</Text>
        </View>
        <Toggle on={preferred} />
      </Card>

      <Button title={tr('rateClient.submit')} full loading={submit.isPending} onPress={() => submit.mutate()} style={{ marginTop: 4 }} />
    </View>
  );
}
