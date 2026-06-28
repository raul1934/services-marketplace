import { Redirect } from 'expo-router';

// The Gate in _layout handles auth-based redirects; default to home.
export default function Index() {
  return <Redirect href="/(tabs)/home" />;
}
