/**
 * Platform commission Chama Fácil takes from a provider's payout. The real rate
 * depends on the provider's plan and comes from the API
 * (provider_profile.commission_rate); this constant is only the default used
 * when that value isn't available yet (the Free plan: 5%).
 */
export const PLATFORM_FEE_RATE = 0.05;

export function calcPayout(gross: number, rate: number = PLATFORM_FEE_RATE): { fee: number; net: number } {
  const fee = Math.round(gross * rate * 100) / 100;
  return { fee, net: Math.round((gross - fee) * 100) / 100 };
}
