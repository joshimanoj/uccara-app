/**
 * Benefit Explore Screen for Uccara app
 * Shows mantras filtered by benefit/purpose
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../theme/ThemeContext';
import { supabase, Mantra } from '../../../lib/supabase';
import { mantraRepository } from '../../../lib/DataRepository';
import MantraCard from '../../../components/MantraCard';
import { ChevronLeftIcon } from '../../../components/Icons';

const BENEFIT_INFO: Record<string, { name: string }> = {
  'health-vitality': { name: 'Health & Vitality' },
  'knowledge-wisdom': { name: 'Knowledge & Wisdom' },
  'wealth-prosperity': { name: 'Wealth & Prosperity' },
  'success-desires': { name: 'Success & Desires' },
  'protection-safety': { name: 'Protection & Safety' },
  'strength-overcoming': { name: 'Strength & Overcoming' },
  'peace-harmony': { name: 'Peace & Harmony' },
  'spiritual-growth': { name: 'Spiritual Growth' },
};

export default function BenefitExploreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const benefitInfo = slug ? BENEFIT_INFO[slug] : null;
  const benefitName = benefitInfo?.name || slug || '';

  const fetchMantras = useCallback(async () => {
    if (!slug) return;

    try {
      // Use repository to get data (works offline)
      const allMantras = await mantraRepository.getAllMantras();

      if (!allMantras) {
        setMantras([]);
        return;
      }

      // Search terms from slug
      const searchTerms = slug.split('-');

      // Filter filtering based on benefits_traditional
      // Matching logic: OR condition (if mantra has ANY of the terms)
      const filteredMantras = allMantras.filter(mantra => {
        if (!mantra.benefits_traditional) return false;

        const benefitsLower = mantra.benefits_traditional.toLowerCase();
        return searchTerms.some(term => benefitsLower.includes(term.toLowerCase()));
      });

      // Sort alphabetically by title
      const sortedMantras = filteredMantras.sort((a, b) =>
        a.title_primary.localeCompare(b.title_primary)
      );

      setMantras(sortedMantras);
    } catch (error) {
      console.error('Error fetching mantras:', error);
      setMantras([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchMantras();
  }, [fetchMantras]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchMantras();
  }, [fetchMantras]);

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
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {benefitName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mantras.length} {mantras.length === 1 ? 'mantra' : 'mantras'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
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
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.accent.primary}
            style={styles.loader}
          />
        ) : mantras.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No mantras found for {benefitName}
            </Text>
          </View>
        ) : (
          <View style={styles.mantraList}>
            {mantras.map((mantra) => (
              <MantraCard key={mantra.id} mantra={mantra} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
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
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      marginLeft: 16,
    },
    headerTitle: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontWeight: '700',
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    headerSubtitle: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontWeight: '400',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
      paddingBottom: 100,
    },
    mantraList: {
      gap: 12,
    },
    loader: {
      marginTop: 60,
    },
    emptyState: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontWeight: '400',
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
  });
