import { Redirect } from 'expo-router';
import { flags } from '../src/flags';

// Send the cold start straight to the surface the flags enable. Redirecting to
// the marketplace dashboard unconditionally flashed it (and fired 3 queries)
// before the Gate bounced field-mode users to /(field)/routes — NAV-05.
export default function Index() {
  return <Redirect href={flags.marketplace ? '/(tabs)/dashboard' : '/(field)/routes'} />;
}
