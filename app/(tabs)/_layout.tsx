/**
 * Tab Navigator Layout for Uccara app
 * Bottom navigation with Home, Saved, and Profile tabs
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { HomeIcon, BookmarkIcon, UserIcon } from '../../components/Icons';

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isDark = theme.isDark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#f5f2f0' : '#1a1a1a',
        tabBarInactiveTintColor: isDark ? '#9e9a96' : '#6B6560',
        tabBarStyle: {
          backgroundColor: isDark
            ? (Platform.OS === 'ios' ? 'rgba(20, 18, 20, 0.92)' : '#141214')
            : (Platform.OS === 'ios' ? 'rgba(247, 245, 242, 0.92)' : '#f7f5f2'),
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          borderTopWidth: 1,
          height: Platform.select({
            ios: 60 + insets.bottom,
            android: 72 + insets.bottom,
          }),
          paddingTop: 12,
          paddingBottom: Platform.select({
            ios: insets.bottom + 8,
            android: insets.bottom + 16,
          }),
          position: 'absolute',
          ...Platform.select({
            ios: {
              shadowColor: 'transparent',
            },
            android: {
              elevation: 0,
            },
          }),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10.5,
          marginTop: 4,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <HomeIcon color={color} size={22} filled={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <BookmarkIcon color={color} size={22} filled={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserIcon color={color} size={22} filled={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
