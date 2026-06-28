/**
 * Locale-neutral formatting helpers (currency symbol + SI-style unit
 * abbreviations only). All translatable UI copy and enum labels live in the
 * apps' i18n resource files, not here.
 */

export function brl(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function etaLabel(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

export function distanceLabel(km: number | null | undefined): string {
  if (km == null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Coarse "minutes ago" bucket as a structured value, so the UI can localize it
 * via i18n with a count (e.g. t('time.minutesAgo', { count })). Returns the
 * unit and count rather than pre-formatted text.
 */
export function relativeParts(iso: string | null | undefined): { unit: 'now' | 'minute' | 'hour' | 'day'; count: number } {
  if (!iso) return { unit: 'now', count: 0 };
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return { unit: 'now', count: 0 };
  if (min < 60) return { unit: 'minute', count: min };
  const h = Math.round(min / 60);
  if (h < 24) return { unit: 'hour', count: h };
  return { unit: 'day', count: Math.round(h / 24) };
}
