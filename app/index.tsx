import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useOnboarding } from '../lib/OnboardingContext';

export default function Index() {
  const { isOnboardingComplete, isLoading } = useOnboarding();

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#f7f5f2' }} />;
  }

  if (!isOnboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
