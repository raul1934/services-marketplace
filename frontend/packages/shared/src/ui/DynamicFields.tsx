import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme';
import { CategoryQuestion } from '../types';
import { Field } from './Field';
import { Text } from './Text';

/**
 * Renders a category's backend-defined intake questions generically. Question
 * definitions (id/type/label/options) come from the API, so adding a question
 * is a backend change only. Answers are keyed by question id. `half` questions
 * pair up two-per-row.
 */
export function DynamicFields({
  questions,
  values,
  onChange,
}: {
  questions: CategoryQuestion[];
  values: Record<number, string>;
  onChange: (questionId: number, value: string) => void;
}) {
  // Pair consecutive half-width questions into two-column rows.
  const rows: CategoryQuestion[][] = [];
  let pending: CategoryQuestion | null = null;
  for (const q of questions) {
    if (q.half) {
      if (pending) { rows.push([pending, q]); pending = null; }
      else pending = q;
    } else {
      if (pending) { rows.push([pending]); pending = null; }
      rows.push([q]);
    }
  }
  if (pending) rows.push([pending]);

  return (
    <View style={{ gap: 12 }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((q) => (
            <View key={q.id} style={{ flex: 1 }}>
              <FieldControl field={q} value={values[q.id] ?? ''} onChange={(v) => onChange(q.id, v)} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function FieldControl({ field, value, onChange }: { field: CategoryQuestion; value: string; onChange: (v: string) => void }) {
  const t = useTheme();

  if (field.type === 'select' && field.options?.length) {
    return (
      <View style={{ gap: 6 }}>
        <Text variant="label" color={t.colors.ink2}>{field.label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {field.options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value}
                onPress={() => onChange(o.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: active ? t.colors.accent : t.colors.line,
                  backgroundColor: active ? t.colors.accentSoft : t.colors.surface,
                }}
              >
                <Text variant="label" color={active ? t.colors.accent : t.colors.ink2}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <Field
      label={field.label}
      value={value}
      onChangeText={onChange}
      placeholder={field.placeholder ?? ''}
      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
    />
  );
}
