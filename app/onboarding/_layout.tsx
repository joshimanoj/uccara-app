/**
 * Onboarding Layout for Uccara app
 * Stack navigator for onboarding flow
 */

import { Stack } from 'expo-router';

import { useTheme } from '../../theme/ThemeContext';

export default function OnboardingLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.page,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
