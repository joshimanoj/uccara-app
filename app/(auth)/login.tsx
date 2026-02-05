/**
 * Login Screen for Uccara app
 * Matches mockup: close button, avatar, title, Google + Apple (iOS) buttons, terms
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useTheme } from '../../theme/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  UserIcon,
  CloseIcon,
  GoogleIcon,
  AppleIcon,
} from '../../components/Icons';

// Dynamic import for Google Sign-in to handle missing native module
let GoogleSignin: any = null;
let statusCodes: any = {};

try {
  const googleSignIn = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignIn.GoogleSignin;
  statusCodes = googleSignIn.statusCodes;
} catch (e) {
  console.warn('Google Sign-in native module not available');
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (GoogleSignin) {
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

      try {
        GoogleSignin.configure({
          webClientId,
          iosClientId,
          offlineAccess: true,
        });
      } catch (err) {
        console.warn("GoogleSignin configure failed", err);
      }
    }
  }, []);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Not Available',
        'Google Sign-in requires a development build. Please build the app with native code.'
      );
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const serverAuthCode = userInfo.serverAuthCode || userInfo.data?.serverAuthCode;

      if (!serverAuthCode) {
        throw new Error('No serverAuthCode received from Google');
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/google-auth-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ serverAuthCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange auth code');
      }

      const { session } = await response.json();

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (sessionError) throw sessionError;

      router.back();
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('Google Sign-In error:', error);
        Alert.alert(
          'Sign-in Error',
          error.message || 'Failed to sign in with Google. Please try again.'
        );
      }
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign-In is not available on this device.');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      router.back();
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      console.error('Apple Sign-In error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/legal/terms');
  };

  const handlePrivacy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/legal/privacy');
  };

  const s = createStyles(theme, insets);

  return (
    <View style={s.container}>
      <View style={s.content}>
        {/* Close Button (top right) */}
        <View style={s.header}>
          <Pressable style={s.closeBtn} onPress={handleClose}>
            <CloseIcon size={20} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        {/* Centered Body */}
        <View style={s.body}>
          {/* Avatar */}
          <View style={s.avatar}>
            <UserIcon size={40} color={theme.colors.iconFg.purple} />
          </View>

          {/* Title */}
          <Text style={s.title}>Sign in to Uccāra</Text>
          <Text style={s.subtitle}>Save mantras and sync across devices</Text>

          {/* Auth Buttons */}
          <View style={s.buttons}>
            <Pressable
              style={[s.authBtn, s.googleBtn]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <GoogleIcon size={20} />
              <Text style={s.googleBtnText}>Continue with Google</Text>
            </Pressable>

            {Platform.OS === 'ios' && (
              <Pressable
                style={[s.authBtn, s.appleBtn]}
                onPress={handleAppleSignIn}
                disabled={isLoading}
              >
                <AppleIcon size={20} color="#FFFFFF" />
                <Text style={s.appleBtnText}>Continue with Apple</Text>
              </Pressable>
            )}

            {isLoading && (
              <ActivityIndicator
                size="small"
                color={theme.colors.accent.primary}
                style={s.loader}
              />
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.termsText}>
            By continuing, you agree to our{'\n'}
            <Text style={s.termsLink} onPress={handleTerms}>Terms of Service</Text>
            {' and '}
            <Text style={s.termsLink} onPress={handlePrivacy}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.page,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: insets.top + 12,
      paddingBottom: insets.bottom + 16,
    },

    // Header with close button
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingVertical: 4,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.background.cardSolid,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.sm,
    },

    // Centered body
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },

    // Avatar
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.colors.softAccent.lavender,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },

    // Title
    title: {
      fontFamily: theme.fontFamilies.display.semiBold,
      fontSize: 26,
      color: theme.colors.text.primary,
      letterSpacing: -0.5,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 32,
    },

    // Auth Buttons
    buttons: {
      width: '100%',
    },
    authBtn: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 14,
      marginBottom: 12,
    },
    googleBtn: {
      backgroundColor: theme.colors.background.cardSolid,
      borderWidth: 1,
      borderColor: theme.colors.ui.border,
      ...theme.shadows.sm,
    },
    googleBtnText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 15,
      color: theme.colors.text.primary,
    },
    appleBtn: {
      backgroundColor: theme.colors.text.primary,
      ...theme.shadows.md,
    },
    appleBtnText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 15,
      color: theme.colors.text.inverse,
    },
    loader: {
      marginTop: 16,
    },

    // Footer
    footer: {
      paddingTop: 16,
    },
    termsText: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 11,
      color: theme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 18,
    },
    termsLink: {
      color: theme.colors.text.secondary,
    },
  });
