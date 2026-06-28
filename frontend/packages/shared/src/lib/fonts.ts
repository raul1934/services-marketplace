/**
 * Manrope is bundled locally per weight (@expo-google-fonts/manrope, loaded in
 * each app's root layout). Each weight is its own font family, so we map a CSS
 * fontWeight to the matching family name. Works on web and native.
 */
const MANROPE: Record<string, string> = {
  '400': 'Manrope_400Regular',
  '500': 'Manrope_500Medium',
  '600': 'Manrope_600SemiBold',
  '700': 'Manrope_700Bold',
  '800': 'Manrope_800ExtraBold',
};

/** The weight keys an app must load via useFonts(). */
export const MANROPE_WEIGHTS = Object.keys(MANROPE);

export function manropeFor(weight?: string | number): string {
  const w = Number(weight ?? 400);
  if (w >= 750) return MANROPE['800'];
  if (w >= 650) return MANROPE['700'];
  if (w >= 550) return MANROPE['600'];
  if (w >= 450) return MANROPE['500'];
  return MANROPE['400'];
}
