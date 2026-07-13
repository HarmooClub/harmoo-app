import { Redirect } from 'expo-router';

export default function Index() {
  // Use Redirect component instead of router.replace() to avoid
  // "Attempted to navigate before mounting" error
  return <Redirect href="/(tabs)" />;
}
