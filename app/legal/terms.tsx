/**
 * Terms and Conditions Screen for Uccara app
 */

import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { ChevronLeftIcon } from '../../components/Icons';

export default function TermsAndConditionsScreen() {
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
                <Text style={styles.headerTitle}>Terms and Conditions</Text>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.lastUpdated}>Last Updated: January 27, 2026</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                    <Text style={styles.text}>
                        By downloading and using Uccāra, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>2. Use of Content</Text>
                    <Text style={styles.text}>
                        Uccāra provides mantra texts, transcriptions, and audio for personal, non-commercial use only. You may not redistribute, sell, or commercially exploit any content from the app without explicit permission.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>3. Offline Downloads</Text>
                    <Text style={styles.text}>
                        The app allows you to download audio for offline listening. These files are for your personal use within the app and should not be extracted or shared.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>4. Account Responsibilities</Text>
                    <Text style={styles.text}>
                        You are responsible for maintaining the security of your account when signing in via third-party providers. We are not liable for any loss resulting from unauthorized access to your account.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5. Modifications</Text>
                    <Text style={styles.text}>
                        We reserve the right to modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.
                    </Text>
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
