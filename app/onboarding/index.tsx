import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
    BookIcon,
    PlayIcon,
    CloudOfflineIcon,
    TridentIcon,
    ChevronRightIcon
} from '../../components/Icons';

import { useTheme } from '../../theme/ThemeContext';
import { spacing } from '../../theme/spacing';
import { useOnboarding } from '../../lib/OnboardingContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Feature Data from HTML
const FEATURES = [
    {
        title: 'Word-by-word meanings',
        desc: 'Understand every syllable as you chant',
        icon: BookIcon,
        bgColor: '#f5e6d8', // Peach
        iconColor: '#c08050',
        delay: 600,
    },
    {
        title: 'Audio for chant along',
        desc: 'Follow along with guided audio playback',
        icon: PlayIcon,
        bgColor: '#dceee8', // Mint
        iconColor: '#4a9c7e',
        delay: 750,
    },
    {
        title: 'Use even when offline',
        desc: 'Download mantras for anytime access',
        icon: CloudOfflineIcon,
        bgColor: '#e8e0f0', // Lavender
        iconColor: '#7c5ca0',
        delay: 900,
    },
];

export default function OnboardingScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { completeOnboarding } = useOnboarding();

    const handleGetStarted = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await completeOnboarding();
        router.replace('/(tabs)');
    };

    const handleSignIn = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Don't mark complete - let them come back if they cancel login
        router.push('/(auth)/login');
    };

    const styles = createStyles(theme, insets);

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={styles.logoContainer}
            >
                <Text style={styles.logo}>Uccāra</Text>
            </Animated.View>

            <View style={styles.content}>
                {/* Headline */}
                <Animated.Text
                    entering={FadeInUp.delay(400).springify()}
                    style={styles.headline}
                >
                    Learn and chant{'\n'}stotrams
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text
                    entering={FadeInUp.delay(550).springify()}
                    style={styles.subtitle}
                >
                    Everything you need, in one place
                </Animated.Text>

                {/* Feature Cards */}
                <View style={styles.features}>
                    {FEATURES.map((feature, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInUp.delay(feature.delay).springify().damping(12)}
                            style={styles.featureCard}
                        >
                            {/* Decorative Circle (Simulated with absolute view if needed, but keeping simple for now) */}

                            <View style={[styles.iconContainer, { backgroundColor: feature.bgColor }]}>
                                <feature.icon size={22} color={feature.iconColor} filled={false} />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDesc}>{feature.desc}</Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>
            </View>

            {/* CTAs */}
            <Animated.View
                entering={FadeInUp.delay(1200).springify()}
                style={styles.footer}
            >
                <Pressable
                    style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.9 }]}
                    onPress={handleGetStarted}
                >
                    <Text style={styles.primaryButtonText}>Get Started</Text>
                </Pressable>

                <Pressable onPress={handleSignIn} style={{ padding: 10 }}>
                    <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const createStyles = (theme: any, insets: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#f7f5f2', // Match HTML bg
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
        },
        logoContainer: {
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 20,
        },
        logo: {
            fontFamily: 'CrimsonPro_600SemiBold',
            fontSize: 28,
            color: '#1a1a1a',
            letterSpacing: -0.5,
        },
        content: {
            flex: 1,
            paddingHorizontal: spacing.layout.containerPadH,
            justifyContent: 'center',
            marginTop: -60, // Slight visual offset upwards
        },
        headline: {
            fontFamily: 'CrimsonPro_600SemiBold',
            fontSize: 36,
            color: '#1a1a1a',
            textAlign: 'center',
            lineHeight: 44,
            marginBottom: 12,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: '#7a7570',
            textAlign: 'center',
            marginBottom: 36,
            lineHeight: 20,
        },
        features: {
            gap: 12,
        },
        featureCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            padding: 18,
            paddingHorizontal: 20,
            borderRadius: 18,
            gap: 16,
            ...theme.shadows.sm,
            shadowOpacity: 0.05,
        },
        iconContainer: {
            width: 48,
            height: 48,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
        },
        textContainer: {
            flex: 1,
        },
        featureTitle: {
            fontFamily: 'Inter_600SemiBold', // Using 600 as per CSS
            fontSize: 15,
            color: '#1a1a1a',
            marginBottom: 2,
        },
        featureDesc: {
            fontFamily: 'Inter_400Regular',
            fontSize: 12.5,
            color: '#7a7570',
        },
        footer: {
            paddingHorizontal: spacing.layout.containerPadH,
            paddingBottom: spacing.layout.tabsMb,
            gap: 16,
            alignItems: 'center',
        },
        primaryButton: {
            width: '100%',
            backgroundColor: '#1a1a1a',
            paddingVertical: 18, // Taller button
            borderRadius: 16,
            alignItems: 'center',
            shadowColor: '#1a1a1a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
        },
        primaryButtonText: {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 16,
            color: '#FFFFFF',
        },
        secondaryButtonText: {
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: '#7a7570',
        },
    });
