/**
 * Home Screen (Dashboard) for Uccara app
 * Main browse interface with deity filters, benefits, and collections
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  LayoutAnimation,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase, Mantra } from '../../lib/supabase';
import { mantraRepository } from '../../lib/DataRepository';
import { spacing } from '../../theme/spacing';
import {
  SearchIcon,
  TridentIcon,
  GaneshaIcon,
  MoonIcon,
  HeartIcon,
  SparklesIcon,
  PlayIcon,
  PeacockFeatherIcon,
  MaceIcon,
  LotusIcon,
  BowIcon,
  BookIcon,
  ShieldIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  FlameIcon,
  GemIcon,
  TargetIcon,
  ModakIcon,
  FluteIcon,
  ConchIcon,
  OwlEyesIcon,
} from '../../components/Icons';
import MantraCard from '../../components/MantraCard';

// Palette definitions – light + dark variants from design mockups
const LIGHT_PALETTE = {
  bg: '#f7f5f2',
  card: '#ffffff',
  peach: '#f5e6d8',
  mint: '#dceee8',
  lavender: '#e8e0f0',
  gold: '#f0e8d0',
  blush: '#f0dce0',
  cream: '#f0ece4',
  peachDark: '#e8a060',
  mintDark: '#5aaa85',
  lavDark: '#9a7cc0',
  goldDark: '#c8a840',
  blushDark: '#cc8090',
  creamDark: '#a89070',
  iconWarm: '#c08050',
  iconGreen: '#4a9c7e',
  iconPurple: '#7c5ca0',
  iconGold: '#b09040',
  iconRose: '#c07080',
  iconBrown: '#8a7560',
};

const DARK_PALETTE = {
  bg: '#141214',
  card: '#232125',
  peach: '#3d2a24',
  mint: '#1e3530',
  lavender: '#2d2638',
  gold: '#352e1e',
  blush: '#3a252a',
  cream: '#2a2724',
  peachDark: '#e8a070',
  mintDark: '#6cc9a8',
  lavDark: '#b08ed0',
  goldDark: '#d4b860',
  blushDark: '#e898a8',
  creamDark: '#c4a890',
  iconWarm: '#e8a070',
  iconGreen: '#6cc9a8',
  iconPurple: '#b08ed0',
  iconGold: '#d4b860',
  iconRose: '#e898a8',
  iconBrown: '#c4a890',
};

const getPalette = (isDark: boolean) => isDark ? DARK_PALETTE : LIGHT_PALETTE;

const getDeities = (p: typeof LIGHT_PALETTE) => [
  { name: 'Durga', bgColor: p.peach, accentColor: p.peachDark, iconColor: p.iconWarm, iconType: 'trident' },
  { name: 'Ganesha', bgColor: p.mint, accentColor: p.mintDark, iconColor: p.iconGreen, iconType: 'modak' },
  { name: 'Shiva', bgColor: p.lavender, accentColor: p.lavDark, iconColor: p.iconPurple, iconType: 'moon' },
  { name: 'Krishna', bgColor: p.gold, accentColor: p.goldDark, iconColor: p.iconGold, iconType: 'flute' },
  { name: 'Hanuman', bgColor: p.blush, accentColor: p.blushDark, iconColor: p.iconRose, iconType: 'mace' },
  { name: 'Vishnu', bgColor: p.cream, accentColor: p.creamDark, iconColor: p.iconBrown, iconType: 'conch' },
  { name: 'Saraswati', bgColor: p.peach, accentColor: p.peachDark, iconColor: p.iconWarm, iconType: 'book' },
  { name: 'Lakshmi', bgColor: p.mint, accentColor: p.mintDark, iconColor: p.iconGreen, iconType: 'owl_eyes' },
];

// Focus/Benefits
const getBenefits = (p: typeof LIGHT_PALETTE) => [
  { name: 'Health', slug: 'health-vitality', icon: 'heart', bgColor: p.mint, accentColor: p.mintDark, iconColor: p.iconGreen },
  { name: 'Knowledge', slug: 'knowledge-wisdom', icon: 'book', bgColor: p.peach, accentColor: p.peachDark, iconColor: p.iconWarm },
  { name: 'Wealth', slug: 'wealth-prosperity', icon: 'gem', bgColor: p.lavender, accentColor: p.lavDark, iconColor: p.iconPurple },
  { name: 'Success', slug: 'success-desires', icon: 'target', bgColor: p.gold, accentColor: p.goldDark, iconColor: p.iconGold },
  { name: 'Protection', slug: 'protection-safety', icon: 'shield', bgColor: p.blush, accentColor: p.blushDark, iconColor: p.iconRose },
  { name: 'Strength', slug: 'strength-overcoming', icon: 'flame', bgColor: p.peach, accentColor: p.peachDark, iconColor: p.iconWarm },
  { name: 'Peace', slug: 'peace-harmony', icon: 'sparkle', bgColor: p.cream, accentColor: p.creamDark, iconColor: p.iconBrown },
  { name: 'Spirituality', slug: 'spiritual-growth', icon: 'lotus', bgColor: p.lavender, accentColor: p.lavDark, iconColor: p.iconPurple },
];

// Collections for "Handpicked for you" section
const getCollections = (p: typeof LIGHT_PALETTE, isDark: boolean) => [
  {
    name: 'Start Here',
    slug: 'start-here',
    subtitle: '7 mantras',
    icon: 'play',
    bgGradient: isDark ? ['#2a2024', '#1f1a1c'] : ['#faf5ef', '#f5ebe0'],
    iconColor: p.peach,
    textColor: p.iconWarm,
  },
  {
    name: 'Most Popular',
    slug: 'most-popular',
    subtitle: '7 mantras',
    icon: 'sparkle',
    bgGradient: isDark ? ['#1e2826', '#1a201f'] : ['#eef5f2', '#dff0e8'],
    iconColor: p.mint,
    textColor: p.iconGreen,
  },
  {
    name: 'Quick Devotion',
    slug: 'quick-devotion',
    subtitle: '10 mantras',
    icon: 'clock',
    bgGradient: isDark ? ['#252230', '#1c1a24'] : ['#f3eff8', '#ebe3f2'],
    iconColor: p.lavender,
    textColor: p.iconPurple,
  },
  {
    name: 'Easy to Learn',
    slug: 'easy-to-learn',
    subtitle: '11 mantras',
    icon: 'arrow-up',
    bgGradient: isDark ? ['#28251c', '#1e1c18'] : ['#fdf8ee', '#f5edda'],
    iconColor: p.gold,
    textColor: p.iconGold,
  },
  {
    name: 'Daily Practice',
    slug: 'for-daily-practice',
    subtitle: '11 mantras',
    icon: 'arrow-right',
    bgGradient: isDark ? ['#2a2228', '#1f1a1e'] : ['#faf0f2', '#f2dfe3'],
    iconColor: p.blush,
    textColor: p.iconRose,
  },
];


const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Dynamic calculations are moved inside component or recalculated
// We will use spacing tokens directly in styles


type TabType = 'deity' | 'focus';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const isDark = theme.isDark;
  const PALETTE = getPalette(isDark);
  const DEITIES = getDeities(PALETTE);
  const BENEFITS = getBenefits(PALETTE);
  const COLLECTIONS = getCollections(PALETTE, isDark);

  const [activeTab, setActiveTab] = useState<TabType>('deity');
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMantras = useCallback(async () => {
    try {
      // Use repository for offline support
      const data = await mantraRepository.getAllMantras();
      console.log('Fetched mantras:', data?.length);
      setMantras(data || []);
    } catch (error: any) {
      console.log('Error fetching mantras:', error?.message || error);

    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMantras();
    // Trigger background sync for total offline capability
    mantraRepository.syncAllMantras();
  }, [fetchMantras]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchMantras();
  }, [fetchMantras]);

  const handleDeityPress = (deity: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/explore/deity/${deity.toLowerCase()}`);
  };

  const handleBenefitPress = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/explore/benefit/${slug}`);
  };

  const handleCollectionPress = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/explore/collection/${slug}`);
  };

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/explore/search');
  };

  const handleTabPress = (tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };


  const { width } = useWindowDimensions();
  const styles = createStyles(theme, insets, isDark, PALETTE, width);

  return (
    <View style={styles.container}>
      {/* Fixed Layout Top */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Uccāra</Text>
        </View>

        {/* Search Bar */}
        <Pressable style={styles.searchBar} onPress={handleSearchPress}>
          <SearchIcon size={18} color={isDark ? '#5c585a' : '#bbbbbb'} />
          <Text style={styles.searchPlaceholder}>Search mantras, deities, benefits…</Text>
        </Pressable>

        {/* Explore Section Label */}
        <Text style={styles.sectionLabel}>Explore</Text>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <View style={styles.tabSegment}>
            {(['deity', 'focus'] as TabType[]).map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && styles.activeTab,
                ]}
                onPress={() => handleTabPress(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab && styles.activeTabText,
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={styles.gridSection}>
          {activeTab === 'deity' && (
            <View style={styles.gridList}>
              {DEITIES.map((deity) => (
                <View key={deity.name} style={styles.deityCardWrapper}>
                  <Pressable
                    style={styles.deityCard}
                    onPress={() => handleDeityPress(deity.name)}
                  >
                    <View style={[styles.deityIconContainer, { backgroundColor: deity.bgColor }]}>
                      {deity.iconType === 'trident' && <TridentIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'modak' && <ModakIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'moon' && <MoonIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'flute' && <FluteIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'mace' && <MaceIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'conch' && <ConchIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'book' && <BookIcon size={22} color={deity.iconColor} />}
                      {deity.iconType === 'owl_eyes' && <OwlEyesIcon size={22} color={deity.iconColor} />}
                    </View>
                    <View style={[styles.cardAccent, { backgroundColor: deity.accentColor }]} />
                    <View style={styles.deityNameContainer}>
                      <Text style={styles.deityName}>{deity.name}</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'focus' && (
            <View style={styles.gridList}>
              {BENEFITS.map((benefit) => (
                <View key={benefit.slug} style={styles.focusCardWrapper}>
                  <Pressable
                    style={styles.focusCard}
                    onPress={() => handleBenefitPress(benefit.slug)}
                  >
                    <View style={[styles.focusIconContainer, { backgroundColor: benefit.bgColor }]}>
                      {benefit.icon === 'heart' && <HeartIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'book' && <BookIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'gem' && <GemIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'target' && <TargetIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'shield' && <ShieldIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'flame' && <FlameIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'sparkle' && <SparklesIcon size={22} color={benefit.iconColor} />}
                      {benefit.icon === 'lotus' && <LotusIcon size={22} color={benefit.iconColor} />}
                    </View>
                    <View style={[styles.cardAccent, { backgroundColor: benefit.accentColor }]} />
                    <View style={styles.focusNameContainer}>
                      <Text style={styles.focusName}>{benefit.name}</Text>
                    </View>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Handpicked For You */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel1}>Curated</Text>
          {width > 550 ? (
            /* Tablet Grid Layout */
            <View style={styles.gridList}>
              {COLLECTIONS.map((collection) => (
                <Pressable
                  key={collection.slug}
                  style={styles.hCard}
                  onPress={() => handleCollectionPress(collection.slug)}
                >
                  <LinearGradient
                    colors={collection.bgGradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                  />

                  <View style={[styles.hIcon, { backgroundColor: collection.iconColor }]}>
                    {collection.icon === 'play' && <PlayIcon size={20} color={collection.textColor} filled />}
                    {collection.icon === 'sparkle' && <SparklesIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'clock' && <ClockIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'arrow-up' && <ArrowUpIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'arrow-right' && <ArrowRightIcon size={20} color={collection.textColor} />}
                  </View>

                  <View>
                    <Text style={styles.hTitle}>{collection.name}</Text>
                    <Text style={styles.hSub}>{collection.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            /* Mobile Horizontal Scroll */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
              style={styles.hScroll}
            >
              {COLLECTIONS.map((collection) => (
                <Pressable
                  key={collection.slug}
                  style={styles.hCard}
                  onPress={() => handleCollectionPress(collection.slug)}
                >
                  <LinearGradient
                    colors={collection.bgGradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                  />

                  <View style={[styles.hIcon, { backgroundColor: collection.iconColor }]}>
                    {collection.icon === 'play' && <PlayIcon size={20} color={collection.textColor} filled />}
                    {collection.icon === 'sparkle' && <SparklesIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'clock' && <ClockIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'arrow-up' && <ArrowUpIcon size={20} color={collection.textColor} />}
                    {collection.icon === 'arrow-right' && <ArrowRightIcon size={20} color={collection.textColor} />}
                  </View>

                  <View>
                    <Text style={styles.hTitle}>{collection.name}</Text>
                    <Text style={styles.hSub}>{collection.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Bottom Spacer to clear Absolute Tab Bar */}

      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, insets: any, isDark: boolean, palette: typeof LIGHT_PALETTE, width: number) => {
  // Adjusted breakpoints: > 900 for 4 columns (Landscape), > 550 for 3 columns (Portrait Tablet), else 2
  const numColumns = width > 900 ? 4 : (width > 550 ? 3 : 2);
  const cardWidth = (width - (spacing.layout.containerPadH * 2) - (spacing.grid.deityGap * (numColumns - 1))) / numColumns - 0.5;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.bg,
      paddingTop: insets.top,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingTop: spacing.layout.containerPadTop,
      paddingBottom: spacing.layout.containerPadBottom + insets.bottom,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.layout.containerPadH,
      marginBottom: spacing.layout.logoMb,
      marginTop: 4,
    },
    title: {
      fontFamily: 'CrimsonPro_600SemiBold',
      fontSize: 30,
      fontWeight: '600',
      letterSpacing: -0.5,
      color: isDark ? '#f5f2f0' : '#1a1a1a',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? palette.card : '#FFFFFF',
      marginHorizontal: spacing.layout.containerPadH,
      marginBottom: spacing.layout.searchMb,
      paddingHorizontal: spacing.components.search.px,
      paddingVertical: spacing.components.search.py,
      borderRadius: 16,
      gap: spacing.components.search.gap,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E8E4DF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 3,
      elevation: 2,
    },
    searchPlaceholder: {
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
      color: isDark ? '#B5AEA6' : '#B5AEA6',
      flex: 1,
    },
    section: {
      marginBottom: 0,
      overflow: 'visible',
    },
    sectionLabel: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: isDark ? '#8a8588' : '#7a7570',
      marginBottom: spacing.layout.sectionMb,
      marginTop: spacing.layout.sectionMt,
      paddingHorizontal: spacing.layout.containerPadH,
    },
    sectionLabel1: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
      color: isDark ? '#8a8588' : '#7a7570',
      marginBottom: spacing.layout.sectionMb,
      paddingHorizontal: spacing.layout.containerPadH,
    },
    tabContainer: {
      paddingHorizontal: spacing.layout.containerPadH,
      marginBottom: spacing.layout.tabsMb,
    },
    tabSegment: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      borderRadius: 12,
      padding: 0,
      gap: spacing.components.tab.gap,
      borderWidth: 0,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.components.tab.py,
      paddingHorizontal: spacing.components.tab.px,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: isDark ? palette.card : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#E8E4DF',
    },
    activeTab: {
      backgroundColor: isDark ? '#FFFFFF' : '#2C2C2C',
      borderColor: isDark ? '#FFFFFF' : '#2C2C2C',
    },
    tabText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      color: isDark ? '#B5AEA6' : '#6B6560',
    },
    activeTabText: {
      fontFamily: 'Inter_500Medium',
      color: isDark ? '#1A1A1A' : '#FFFFFF',
    },
    gridSection: {
      marginBottom: 28,
      minHeight: 200,
    },
    gridList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.layout.containerPadH,
      gap: spacing.grid.deityGap,
      marginBottom: spacing.layout.deityGridMb,
    },
    deityCardWrapper: {
      width: cardWidth,
      borderRadius: 18,
      backgroundColor: palette.card,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
      ...theme.shadows.sm,
      shadowOpacity: isDark ? 0.5 : 0.06,
    },
    deityCard: {
      width: '100%',
      borderRadius: 18,
      backgroundColor: palette.card,
      paddingHorizontal: spacing.components.deityCard.px,
      paddingVertical: spacing.components.deityCard.py,
      alignItems: 'center',
      gap: spacing.components.deityCard.gap,
      overflow: 'hidden',
    },
    deityIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deityNameContainer: {
      alignItems: 'center',
      paddingBottom: 0,
    },
    deityName: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12.5,
      color: isDark ? '#f5f2f0' : '#1a1a1a',
      textAlign: 'center',
      lineHeight: 16,
    },
    cardAccent: {
      position: 'absolute',
      top: -12,
      right: -12,
      width: 40,
      height: 40,
      borderRadius: 20,
      opacity: 0.15,
    },
    focusCardWrapper: {
      width: cardWidth,
      borderRadius: 18,
      backgroundColor: palette.card,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.03)' : 'transparent',
      ...theme.shadows.sm,
      shadowOpacity: isDark ? 0.5 : 0.06,
    },
    focusCard: {
      width: '100%',
      borderRadius: 18,
      backgroundColor: palette.card,
      paddingHorizontal: spacing.components.deityCard.px,
      paddingVertical: spacing.components.deityCard.py,
      alignItems: 'center',
      gap: spacing.components.deityCard.gap,
      overflow: 'hidden',
    },
    focusIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    focusNameContainer: {
      alignItems: 'center',
      paddingBottom: 0,
    },
    focusName: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12.5,
      color: isDark ? '#f5f2f0' : '#1a1a1a',
      textAlign: 'center',
      lineHeight: 16,
    },
    hScroll: {
      flexGrow: 0,
      overflow: 'visible',
      minHeight: 190,
    },
    hScrollContent: {
      paddingHorizontal: spacing.layout.containerPadH,
      paddingBottom: 24,
      gap: spacing.grid.curatedGap,
    },
    hCard: {
      width: width > 550
        // Tablet: Same grid logic as deity cards
        ? cardWidth
        // Mobile: Existing logic for peeking cards
        : Math.round((Dimensions.get('window').width - spacing.layout.containerPadH - (spacing.grid.curatedGap * 2)) / 2.15),
      height: 120,
      borderRadius: 18,
      paddingHorizontal: spacing.components.curatedCard.px,
      paddingVertical: spacing.components.curatedCard.py,
      justifyContent: 'space-between',
      backgroundColor: isDark ? palette.card : '#fff',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.5 : 0.05,
      shadowRadius: 16,
      elevation: 4,
      gap: 10,
      // For tablet grid layout
      marginBottom: width > 550 ? spacing.grid.deityGap : 0,
    },
    hIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hTitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      color: isDark ? '#f5f2f0' : '#1a1a1a',
      lineHeight: 17,
    },
    hSub: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11.5,
      color: isDark ? '#8a8588' : '#7a7570',
      marginTop: -4,
    },
  });
};
