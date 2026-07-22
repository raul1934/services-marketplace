/**
 * Brazilian phone numbers, in one place.
 *
 * The apps were doing `'55' + phone.replace(/\D/g, '')` inline at each call
 * site, with no mask and no validation: the field accepted anything, and a
 * typo only surfaced as an OTP that never arrived — the worst possible place
 * to discover it, because the user has no way to tell a wrong number from a
 * slow SMS.
 *
 * `55` stays hardcoded: this is a Brazil-only product and pretending otherwise
 * would mean a country picker nobody needs. It lives here so that when that
 * stops being true, there is one place to change.
 */
export const BR_COUNTRY_CODE = '55';

/** Digits only, capped at the 11 a Brazilian number can have (DDD + 9 digits). */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, 11);
}

/**
 * Formats as the user types: `(11) 91234-5678`, or `(11) 1234-5678` for the
 * eight-digit landline form. Partial input stays partial — masking is there to
 * help someone read back what they typed, not to insist they finish.
 */
export function maskPhoneBR(input: string): string {
  const d = phoneDigits(input);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  // 9 digits means mobile (5+4); 8 means landline (4+4).
  const split = rest.length > 8 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/**
 * A DDD (11–99, never starting at 0) plus 8 or 9 subscriber digits, and a
 * mobile must start with 9. Deliberately not stricter: carrier ranges change,
 * and a validator that is wrong about a real number is worse than one that
 * lets a wrong number through to the OTP.
 */
export function isValidPhoneBR(input: string): boolean {
  const d = phoneDigits(input);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d[0] === '0') return false;
  if (d.length === 11 && d[2] !== '9') return false;

  return true;
}

/** `55` + digits, the shape the API expects. */
export function toE164BR(input: string): string {
  return BR_COUNTRY_CODE + phoneDigits(input);
}
