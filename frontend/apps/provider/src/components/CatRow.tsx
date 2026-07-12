import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icon, Row, ServiceCategory, Text, useTheme } from '@chamafacil/shared';
import { CategoryIcon } from './CategoryIcon';

/** One-line category row with optional subtitle + trailing check (chamafacil .cat-row). */
export function CatRow({
  category,
  selected,
  onPress,
  subtitle,
}: {
  category: ServiceCategory;
  selected: boolean;
  onPress: () => void;
  subtitle?: string;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Pressable onPress={onPress}>
      <Row
        style={{
          gap: 12,
          backgroundColor: selected ? t.colors.accentSoft : t.colors.surface,
          borderWidth: 1.5,
          borderColor: selected ? t.colors.accent : t.colors.line,
          borderRadius: t.radius.field,
          paddingVertical: 11,
          paddingHorizontal: 14,
        }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: selected ? t.colors.accent : t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <CategoryIcon category={category} size={21} color={selected ? '#fff' : t.colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="800" style={{ fontSize: 14.5 }} numberOfLines={1}>{tr(`categories.${category.slug}`, { defaultValue: category.name })}</Text>
          {subtitle ? <Text variant="caption" numberOfLines={1} style={{ marginTop: 1 }}>{subtitle}</Text> : null}
        </View>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? t.colors.accent : t.colors.line, backgroundColor: selected ? t.colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color="#fff" />}
        </View>
      </Row>
    </Pressable>
  );
}
