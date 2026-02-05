/**
 * Collection Explore Screen for Uccara app
 * Shows mantras from curated collections
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

const COLLECTION_INFO: Record<string, { name: string; description: string }> = {
  'start-here': {
    name: 'Start Here',
    description: 'Essential mantras for beginners',
  },
  'most-popular': {
    name: 'Most Popular',
    description: 'Widely practiced mantras',
  },
  'quick-devotion': {
    name: 'Quick Devotion',
    description: 'Short mantras for busy moments',
  },
  'for-daily-practice': {
    name: 'For Daily Practice',
    description: 'Mantras for regular recitation',
  },
  'easy-to-learn': {
    name: 'Easy to Learn',
    description: 'Simple mantras perfect for beginners',
  },
};

export default function CollectionExploreScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const collectionInfo = slug ? COLLECTION_INFO[slug] : null;
  const collectionName = collectionInfo?.name || slug || '';

  const fetchMantras = useCallback(async () => {
    if (!slug) return;

    try {
      // Use repository to get data (works offline)
      const allMantras = await mantraRepository.getAllMantras();

      if (!allMantras) {
        setMantras([]);
        return;
      }

      // Sort alphabetically by title
      let sortedMantras = [...allMantras].sort((a, b) =>
        a.title_primary.localeCompare(b.title_primary)
      );

      // Apply filtering based on collection slug
      if (slug === 'most-popular') {
        sortedMantras = sortedMantras.slice(0, 10);
      } else if (slug === 'start-here') {
        sortedMantras = sortedMantras.slice(0, 5); // Just taking first 5 alphabetically as per original query logic
      } else if (slug === 'quick-devotion') {
        sortedMantras = sortedMantras.slice(0, 8);
      } else {
        sortedMantras = sortedMantras.slice(0, 12);
      }

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
          <Text style={styles.headerTitle}>{collectionName}</Text>
          {collectionInfo?.description && (
            <Text style={styles.headerSubtitle}>
              {collectionInfo.description}
            </Text>
          )}
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
              No mantras found in this collection
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
      flex: 1,
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
