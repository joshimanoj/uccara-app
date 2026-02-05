import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';

// System font fallbacks for when custom fonts aren't loaded
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

export default function AnimatedSplash({ onLayout }: { onLayout?: () => void }) {
    console.log('[DEBUG] AnimatedSplash: Rendering');
    // Title fade in
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(8);

    // Underline width
    const underlineWidth = useSharedValue(0);
    const underlineOpacity = useSharedValue(0);

    // Tagline fade in
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(6);

    useEffect(() => {
        // Title fades in (0.8s)
        titleOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
        titleTranslateY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.ease) });

        // Underline draws after 600ms delay (1.2s duration)
        underlineOpacity.value = withDelay(600, withTiming(1, { duration: 200 }));
        underlineWidth.value = withDelay(600, withTiming(72, {
            duration: 1200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        }));

        // Underline pulse after initial draw (starts at 2.2s, repeats)
        const pulseTimer = setTimeout(() => {
            underlineWidth.value = withRepeat(
                withSequence(
                    withTiming(58, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(72, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                ),
                -1,
                false,
            );
        }, 2200);

        // Tagline fades in after 1.4s
        taglineOpacity.value = withDelay(1400, withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
        taglineTranslateY.value = withDelay(1400, withTiming(0, { duration: 700, easing: Easing.out(Easing.ease) }));

        return () => clearTimeout(pulseTimer);
    }, []);

    const titleStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: titleOpacity.value,
            transform: [{ translateY: titleTranslateY.value }],
        };
    });

    const underlineStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            width: underlineWidth.value,
            opacity: underlineOpacity.value,
        };
    });

    const taglineStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: taglineOpacity.value,
            transform: [{ translateY: taglineTranslateY.value }],
        };
    });

    return (
        <View style={styles.container} onLayout={onLayout}>
            {/* Decorative blurred blobs */}
            <View style={[styles.blob, styles.blob1]} />
            <View style={[styles.blob, styles.blob2]} />
            <View style={[styles.blob, styles.blob3]} />

            {/* Center content */}
            <View style={styles.content}>
                <Animated.Text style={[styles.title, titleStyle]}>
                    Uccāra
                </Animated.Text>

                {/* Animated underline */}
                <Animated.View style={[styles.underline, underlineStyle]} />

                <Animated.Text style={[styles.tagline, taglineStyle]}>
                    {'Stotras for\nthe modern seeker'}
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f5f2',
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
    content: {
        alignItems: 'center',
        zIndex: 1,
    },
    title: {
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
    tagline: {
        marginTop: 22,
        fontFamily: TAGLINE_FONT,
        fontSize: 15,
        color: '#7a7570',
        textAlign: 'center',
        lineHeight: 23,
    },
});
