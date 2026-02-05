/**
 * Profile Screen for Uccara app
 * Matches mockup: sign-in CTA, theme toggle, settings, about
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  TextInput,
  Modal,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import {
  UserIcon,
  SunIcon,
  BellIcon,
  DownloadIcon,
  LogOutIcon,
  ChevronRightIcon,
  TrashIcon,
  MailIcon,
  ShieldIcon,
  FileTextIcon,
} from '../../components/Icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { user, signOut, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const pillAnim = useRef(new Animated.Value(THEME_MODES.indexOf(themeMode))).current;

  useEffect(() => {
    Animated.spring(pillAnim, {
      toValue: THEME_MODES.indexOf(themeMode),
      useNativeDriver: false,
      tension: 68,
      friction: 12,
    }).start();
  }, [themeMode]);

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
          },
        },
      ]
    );
  };

  const handleThemeModeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeMode(mode);
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to notification settings or open system settings
    Linking.openSettings();
  };

  const handleDownloads = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/downloads');
  };

  const handlePrivacyPolicy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/legal/privacy');
  };

  const handleTerms = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/legal/terms');
  };

  const handleSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:uccara.app@gmail.com');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteConfirmText('');
    setDeleteModalVisible(true);
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    const result = await deleteAccount();
    setIsDeleting(false);
    setDeleteModalVisible(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', result.error || 'Failed to delete account');
    }
  };

  const s = createStyles(theme, insets);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Header */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Profile</Text>
      </View>

      {/* User Card / Sign-in CTA */}
      {user ? (
        <View style={s.signinCta}>
          <View style={[s.ctaAvatar, { backgroundColor: theme.colors.accent.primary }]}>
            <Text style={s.ctaAvatarText}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={s.ctaContent}>
            <Text style={s.ctaTitle}>
              {user.user_metadata?.full_name || 'User'}
            </Text>
            <Text style={s.ctaSubtitle}>{user.email}</Text>
          </View>
        </View>
      ) : (
        <View style={s.signinCta}>
          <View style={[s.ctaAvatar, { backgroundColor: theme.colors.softAccent.lavender }]}>
            <UserIcon size={26} color={theme.colors.iconFg.purple} />
          </View>
          <View style={s.ctaContent}>
            <Text style={s.ctaTitle}>Sign in to Uccāra</Text>
            <Text style={s.ctaSubtitle}>Save mantras and sync across devices</Text>
          </View>
          <Pressable style={s.signinBtn} onPress={handleSignIn}>
            <Text style={s.signinBtnText}>Sign In</Text>
          </Pressable>
        </View>
      )}

      {/* Appearance Section */}
      <Text style={s.sectionLabel}>Appearance</Text>

      <View style={s.themeCard}>
        <View style={s.themeHeader}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.gold }]}>
            <SunIcon size={18} color={theme.colors.iconFg.gold} />
          </View>
          <Text style={s.settingTitle}>Theme</Text>
        </View>
        <View style={s.themeToggle}>
          <Animated.View
            style={[
              s.themePill,
              {
                left: pillAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0.6%', '33.6%', '66.6%'],
                }),
              },
            ]}
          />
          {THEME_MODES.map((mode, index) => (
            <Pressable
              key={mode}
              style={s.themeOption}
              onPress={() => handleThemeModeChange(mode)}
            >
              <Text
                style={[
                  s.themeOptionText,
                  themeMode === mode && s.themeOptionTextActive,
                ]}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Settings Section */}
      <Text style={s.sectionLabel}>Settings</Text>

      <View style={s.settingsGroup}>
        <Pressable style={s.settingsItem} onPress={handleNotifications}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.mint }]}>
            <BellIcon size={18} color={theme.colors.iconFg.green} />
          </View>
          <View style={s.settingsItemContent}>
            <Text style={s.settingTitle}>Notifications</Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.text.muted} />
        </Pressable>

        <View style={s.divider} />

        <Pressable style={s.settingsItem} onPress={handleDownloads}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.peach }]}>
            <DownloadIcon size={18} color={theme.colors.iconFg.warm} />
          </View>
          <View style={s.settingsItemContent}>
            <Text style={s.settingTitle}>Downloads</Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.text.muted} />
        </Pressable>
      </View>

      {/* About Section */}
      <Text style={s.sectionLabel}>About</Text>

      <View style={s.settingsGroup}>
        <Pressable style={s.settingsItem} onPress={handlePrivacyPolicy}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.lavender }]}>
            <ShieldIcon size={18} color={theme.colors.iconFg.purple} />
          </View>
          <View style={s.settingsItemContent}>
            <Text style={s.settingTitle}>Privacy Policy</Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.text.muted} />
        </Pressable>

        <View style={s.divider} />

        <Pressable style={s.settingsItem} onPress={handleTerms}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.gold }]}>
            <FileTextIcon size={18} color={theme.colors.iconFg.gold} />
          </View>
          <View style={s.settingsItemContent}>
            <Text style={s.settingTitle}>Terms and Conditions</Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.text.muted} />
        </Pressable>

        <View style={s.divider} />

        <Pressable style={s.settingsItem} onPress={handleSupport}>
          <View style={[s.iconWrap, { backgroundColor: theme.colors.softAccent.blush }]}>
            <MailIcon size={18} color={theme.colors.iconFg.rose} />
          </View>
          <View style={s.settingsItemContent}>
            <Text style={s.settingTitle}>Contact Support</Text>
          </View>
          <ChevronRightIcon size={18} color={theme.colors.text.muted} />
        </Pressable>
      </View>

      {/* Sign Out & Delete Account */}
      {user ? (
        <View style={s.accountSection}>
          <Pressable style={s.signOutButton} onPress={handleSignOut}>
            <LogOutIcon size={20} color={theme.colors.status.error} />
            <Text style={s.signOutText}>Sign Out</Text>
          </Pressable>

          <Pressable style={s.deleteAccountButton} onPress={handleDeleteAccount}>
            <TrashIcon size={20} color={theme.colors.status.error} />
            <Text style={s.deleteAccountText}>Delete Account</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Version */}
      <Text style={s.versionText}>
        Version {Constants.expoConfig?.version || '1.0.0'}
      </Text>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Delete Account</Text>
            <Text style={s.modalDescription}>
              This action is permanent and cannot be undone. All your data including bookmarks will be deleted.
            </Text>
            <Text style={s.modalPrompt}>Type DELETE to confirm:</Text>
            <TextInput
              style={s.deleteInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor={theme.colors.text.muted}
              autoCapitalize="characters"
            />
            <View style={s.modalButtons}>
              <Pressable
                style={s.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  s.modalDeleteButton,
                  deleteConfirmText !== 'DELETE' && s.modalDeleteButtonDisabled,
                ]}
                onPress={confirmDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                <Text style={s.modalDeleteText}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.page,
    },
    contentContainer: {
      paddingTop: insets.top + 12,
      paddingHorizontal: 24,
      paddingBottom: 84 + insets.bottom,
    },

    // Page Header
    pageHeader: {
      marginBottom: 24,
      marginTop: 8,
    },
    pageTitle: {
      fontFamily: theme.fontFamilies.display.semiBold,
      fontSize: 30,
      color: theme.colors.text.primary,
      letterSpacing: -0.5,
    },

    // Sign-in CTA / User Card
    signinCta: {
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 18,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 28,
      ...theme.shadows.md,
    },
    ctaAvatar: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaAvatarText: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontSize: 22,
      color: '#FFFFFF',
    },
    ctaContent: {
      flex: 1,
      minWidth: 0,
    },
    ctaTitle: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 15,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    ctaSubtitle: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 12,
      color: theme.colors.text.secondary,
      lineHeight: 17,
    },
    signinBtn: {
      backgroundColor: theme.colors.text.primary,
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    signinBtnText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 13,
      color: theme.colors.text.inverse,
    },

    // Section Label
    sectionLabel: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 16,
      letterSpacing: 0.5,
      color: theme.colors.text.secondary,
      marginBottom: 12,
      marginTop: 24,
    },

    // Icon Wrap (shared for settings items)
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Theme Card
    themeCard: {
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
      ...theme.shadows.md,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 16,
    },

    // Theme Toggle (3-option)
    themeToggle: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#eeebe7',
      borderRadius: 12,
      padding: 4,
      flexDirection: 'row',
      position: 'relative',
    },
    themePill: {
      position: 'absolute',
      top: 4,
      width: '32.3%',
      height: '100%',
      backgroundColor: theme.colors.text.primary,
      borderRadius: 10,
      ...theme.shadows.sm,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      zIndex: 1,
    },
    themeOptionText: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 13,
      color: theme.colors.text.secondary,
    },
    themeOptionTextActive: {
      color: theme.colors.text.inverse,
    },

    // Settings Group
    settingsGroup: {
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      ...theme.shadows.md,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingHorizontal: 18,
      gap: 14,
    },
    settingsItemContent: {
      flex: 1,
      minWidth: 0,
    },
    settingTitle: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 14,
      color: theme.colors.text.primary,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.ui.border,
      marginHorizontal: 18,
    },

    // Account section
    accountSection: {
      marginTop: 24,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.colors.background.cardSolid,
      padding: 18,
      borderRadius: 18,
      ...theme.shadows.sm,
    },
    signOutText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 16,
      color: theme.colors.status.error,
    },
    deleteAccountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      padding: 18,
      marginTop: 12,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.status.error,
    },
    deleteAccountText: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 16,
      color: theme.colors.status.error,
    },

    // Version Footer
    versionText: {
      textAlign: 'center',
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 12,
      color: theme.colors.text.muted,
      marginTop: 24,
      paddingBottom: 8,
    },

    // Delete Account Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 340,
    },
    modalTitle: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontSize: 20,
      color: theme.colors.text.primary,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalDescription: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 14,
      color: theme.colors.text.secondary,
      lineHeight: 20,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalPrompt: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 14,
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    deleteInput: {
      backgroundColor: theme.colors.background.elevated,
      borderRadius: 10,
      padding: 14,
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 16,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalCancelButton: {
      flex: 1,
      backgroundColor: theme.colors.background.elevated,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalCancelText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    modalDeleteButton: {
      flex: 1,
      backgroundColor: theme.colors.status.error,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalDeleteButtonDisabled: {
      opacity: 0.5,
    },
    modalDeleteText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 16,
      color: '#FFFFFF',
    },
  });
