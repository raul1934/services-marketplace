import React from 'react';
import { Icon, ICON_NAMES, ServiceCategory, useTheme } from '@chamafacil/shared';

/** Per-type fallback icon (chamafacil set) when a category has no specific icon. */
const TYPE_FALLBACK: Record<string, string> = {
  roadside: 'car',
  residential: 'wrench',
  condo: 'home',
  beauty: 'scissors',
  pet: 'paw',
};

/**
 * Renders a category's icon from the chamafacil icon set. `ServiceCategory.icon`
 * holds a chamafacil icon name (seeded); falls back to a per-type icon when the
 * name is missing or unknown, so nothing renders blank.
 */
/** Resolve a category to its chamafacil icon name (specific icon, else per-type fallback). */
export function categoryIconName(category?: ServiceCategory | null): string {
  const icon = category?.icon ?? '';
  return ICON_NAMES.includes(icon) ? icon : TYPE_FALLBACK[category?.type ?? 'roadside'] ?? 'wrench';
}

export function CategoryIcon({
  category,
  size = 24,
  color,
}: {
  category?: ServiceCategory | null;
  size?: number;
  color?: string;
}) {
  const t = useTheme();
  return <Icon name={categoryIconName(category)} size={size} color={color ?? t.colors.accent} />;
}
