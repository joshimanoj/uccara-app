/**
 * Privacy Policy Screen for Uccara app
 */

import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeftIcon } from '../../components/Icons';

export default function PrivacyPolicyScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const styles = createStyles(theme, insets);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <ChevronLeftIcon size={24} color={theme.colors.text.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Last Updated: January 27, 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                    <Text style={styles.text}>
                        Uccāra collects minimal information to provide you with the best experience:
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>Account Information: When you sign in, we receive your email address and profile name from your chosen provider (Google or Apple).</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>User Content: We store your bookmarked mantras and audio preferences to sync them across your devices.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>Usage Data: We may collect anonymized frequency of mantra listens to improve our content offerings.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. How We Use Information</Text>
                    <Text style={styles.text}>
                        Your information is used strictly for:
                    </Text>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>Personalizing your experience.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>Syncing your "Saved" mantras across different devices.</Text>
                    </View>
                    <View style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>Managing your offline downloads.</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Audio Content</Text>
                    <Text style={styles.text}>
                        Audio files downloaded for offline use are stored locally on your device within the app's secure container. They are not accessible by other applications.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Third-Party Services</Text>
                    <Text style={styles.text}>
                        We use Supabase for our database and authentication. We do not sell, trade, or otherwise transfer your personal information to outside parties for marketing or any other purposes.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Contact Us</Text>
                    <Text style={styles.text}>
                        If you have any questions regarding this Privacy Policy, you may contact us at:
                    </Text>
                    <Text style={styles.email}>uccara.app@gmail.com</Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 Uccāra. All rights reserved.</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const createStyles = (theme: any, insets: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.page,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: theme.colors.background.page,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.ui.divider,
        gap: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.elevated,
    },
    headerTitle: {
        fontFamily: theme.fontFamilies.primary.bold,
        fontSize: 20,
        color: theme.colors.text.primary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 60,
    },
    lastUpdated: {
        fontFamily: theme.fontFamilies.primary.medium,
        fontSize: 14,
        color: theme.colors.text.muted,
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: theme.fontFamilies.primary.bold,
        fontSize: 18,
        color: theme.colors.text.primary,
        marginBottom: 12,
    },
    text: {
        fontFamily: theme.fontFamilies.primary.regular,
        fontSize: 16,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginTop: 8,
        paddingLeft: 4,
    },
    bullet: {
        width: 16,
        fontSize: 16,
        color: theme.colors.accent.primary,
    },
    email: {
        fontFamily: theme.fontFamilies.primary.semiBold,
        fontSize: 16,
        color: theme.colors.accent.primary,
        marginTop: 8,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.colors.ui.divider,
    },
    footerText: {
        fontFamily: theme.fontFamilies.primary.regular,
        fontSize: 14,
        color: theme.colors.text.muted,
    },
});
