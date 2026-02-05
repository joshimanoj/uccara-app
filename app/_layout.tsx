import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useCallback } from 'react';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  CrimsonPro_500Medium,
  CrimsonPro_600SemiBold,
} from '@expo-google-fonts/crimson-pro';

import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { AuthProvider } from '../lib/AuthContext';

import { NetworkProvider } from '../lib/NetworkContext';
import { DownloadProvider } from '../lib/DownloadContext';
import { FavoritesProvider } from '../lib/FavoritesContext';
import { AudioProvider } from '../lib/AudioContext';
import { OnboardingProvider } from '../lib/OnboardingContext';

SplashScreen.preventAutoHideAsync().catch(() => { });

const SPLASH_BG = '#f7f5f2';

const TITLE_FONT = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});
const TAGLINE_FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'sans-serif',
});

// Reverted SystemUIConfig due to native module crash
/*
const SystemUIConfig = () => {
  const { theme } = useTheme();
  useEffect(() => {
    // Safety check: Ensure module and method exist before calling
    if (Platform.OS === 'android' && NavigationBar && NavigationBar.setBackgroundColorAsync) {
      try {
        const bgColor = theme.isDark ? '#141214' : '#f7f5f2';
        NavigationBar.setBackgroundColorAsync(bgColor).catch((err) => {
          console.warn('NavigationBar.setBackgroundColorAsync failed:', err);
        });

        if (NavigationBar.setButtonStyleAsync) {
          NavigationBar.setButtonStyleAsync(theme.isDark ? 'light' : 'dark').catch((err) => {
            console.warn('NavigationBar.setButtonStyleAsync failed:', err);
          });
        }
      } catch (error) {
        console.warn('SystemUIConfig error:', error);
      }
    }
  }, [theme.isDark]);
  return null;
};
*/

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CrimsonPro_500Medium,
    CrimsonPro_600SemiBold,
  });

  const [splashDismissed, setSplashDismissed] = useState(false);
  const overlayOpacity = useSharedValue(1);

  // Splash animations (matching uccara_splash.html design)
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(8);
  const underlineWidth = useSharedValue(0);
  const underlineOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(6);

  // When JS overlay paints, dismiss the native splash underneath.
  const onOverlayLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => { });

    // Start splash animations
    titleOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    titleTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) });

    underlineOpacity.value = withDelay(600, withTiming(1, { duration: 200 }));
    underlineWidth.value = withDelay(600, withTiming(72, {
      duration: 1200,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    }));

    taglineOpacity.value = withDelay(1400, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
    taglineTranslateY.value = withDelay(1400, withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) }));
  }, []);

  // Once fonts are loaded, wait a beat then fade out the overlay.
  useEffect(() => {
    if (fontsLoaded) {
      // Small delay to let the initial navigation settle (index → tabs/onboarding)
      // so there's no black frame from a screen transition behind the overlay.
      const timer = setTimeout(() => {
        overlayOpacity.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) {
            runOnJS(setSplashDismissed)(true);
          }
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  // Failsafe: Force dismiss splash if it hangs for any reason (e.g. animation callback missed)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!splashDismissed) {
        console.log('Splash Screen Failsafe triggered');
        runOnJS(setSplashDismissed)(true);
      }
    }, 6000); // 6 seconds max
    return () => clearTimeout(safetyTimer);
  }, [splashDismissed]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    width: underlineWidth.value,
    opacity: underlineOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SPLASH_BG }}>
      <NetworkProvider>
        <AuthProvider>
          <ThemeProvider>
            {/* <SystemUIConfig /> */}
            <OnboardingProvider>
              <FavoritesProvider>
                <AudioProvider>
                  <DownloadProvider>
                    <Stack screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: SPLASH_BG },
                      animation: 'none',
                    }}>
                      <Stack.Screen name="index" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="onboarding" />
                      <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
                    </Stack>
                  </DownloadProvider>
                </AudioProvider>
              </FavoritesProvider>
            </OnboardingProvider>
          </ThemeProvider>
        </AuthProvider>
      </NetworkProvider>

      {/* Splash overlay matching uccara_splash.html design */}
      {!splashDismissed && (
        <Animated.View
          onLayout={onOverlayLayout}
          style={[styles.overlay, overlayStyle]}
          pointerEvents="none"
        >
          {/* Decorative blobs */}
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />

          {/* Center content */}
          <View style={styles.splashContent}>
            <Animated.Text style={[styles.splashTitle, titleStyle]}>
              Uccāra
            </Animated.Text>
            <Animated.View style={[styles.underline, underlineStyle]} />
            <Animated.Text style={[styles.splashTagline, taglineStyle]}>
              {'Stotras for\nthe modern seeker'}
            </Animated.Text>
          </View>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: SPLASH_BG,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blob1: {
    width: 240,
    height: 240,
    backgroundColor: '#f5e6d8',
    top: -60,
    left: -80,
    opacity: 0.45,
  },
  blob2: {
    width: 200,
    height: 200,
    backgroundColor: '#dceee8',
    bottom: 80,
    right: -70,
    opacity: 0.45,
  },
  blob3: {
    width: 160,
    height: 160,
    backgroundColor: '#e8e0f0',
    bottom: 220,
    left: 20,
    opacity: 0.3,
  },
  splashContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  splashTitle: {
    fontFamily: TITLE_FONT,
    fontSize: 58,
    color: '#1a1a1a',
    letterSpacing: -1,
    paddingBottom: 32,
  },
  underline: {
    height: 2,
    borderRadius: 1,
    backgroundColor: '#c08050',
  },
  splashTagline: {
    marginTop: 22,
    fontFamily: TAGLINE_FONT,
    fontSize: 15,
    color: '#7a7570',
    textAlign: 'center',
    lineHeight: 23,
  },
});
