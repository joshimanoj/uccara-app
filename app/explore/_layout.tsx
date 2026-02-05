/**
 * Explore Layout for Uccara app
 */

import { Stack } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';

export default function ExploreLayout() {
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
    />
  );
}
