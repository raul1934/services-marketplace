import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { RequestAnswer } from '../types';
import { Text } from './Text';

/** Read-only list of a request's intake answers (question text → answer). */
export function AnswerList({ answers }: { answers: RequestAnswer[] }) {
  const t = useTheme();
  if (!answers.length) return null;

  return (
    <View style={{ gap: 0 }}>
      {answers.map((a, i) => (
        <View
          key={`${a.question_id ?? 'q'}-${i}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 9,
            borderTopWidth: i ? 1 : 0,
            borderColor: t.colors.line,
          }}
        >
          <Text variant="caption" weight="700" style={{ flex: 1 }}>{a.text}</Text>
          <Text weight="700" style={{ fontSize: 13.5 }} numberOfLines={1}>{a.answer}</Text>
        </View>
      ))}
    </View>
  );
}
