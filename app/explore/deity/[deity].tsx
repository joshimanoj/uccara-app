/**
 * Deity Explore Screen for Uccara app
 * Shows mantras filtered by deity
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

// Map common deity names to all their alternative names in the database
const DEITY_ALIASES: Record<string, string[]> = {
  ganesha: ['Ganapati', 'Vinayaka', 'Ekadanta', 'Vighnaharta', 'Ganesha'],
  shiva: ['Shiva', 'Mahadeva', 'Rudra', 'Shankara', 'Tryambaka', 'Nataraja'],
  krishna: ['Krishna', 'Govinda', 'Hari', 'Gopala', 'Damodara', 'Achyuta', 'Madhava', 'Narayana'],
  rama: ['Raghava', 'Dasharathi', 'Raghupati', 'Rama'],
  hanuman: ['Bajrangbali', 'Maruti', 'Anjaneya', 'Sankata Mochana', 'Hanuman'],
  vishnu: ['Vishnu', 'Narayana', 'Hari', 'Purushottama', 'Balaji', 'Srinivasa', 'Achyuta'],
  devi: ['Chandi', 'Ambika', 'Mahishasuramardini', 'Chandika', 'Tripurasundari', 'Rajarajeshwari', 'Devi', 'Durga'],
  durga: ['Chandi', 'Ambika', 'Mahishasuramardini', 'Chandika', 'Tripurasundari', 'Rajarajeshwari', 'Devi', 'Durga'],
  lakshmi: ['Shri', 'Kamala', 'Mahalakshmi', 'Lakshmi'],
  saraswati: ['Vani', 'Sharada', 'Saraswati'],
};

export default function DeityExploreScreen() {
  const { deity } = useLocalSearchParams<{ deity: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Capitalize deity name
  const deityName = deity
    ? deity.charAt(0).toUpperCase() + deity.slice(1)
    : '';

  const fetchMantras = useCallback(async () => {
    if (!deity) return;

    try {
      // Use repository for offline support
      // Network fetch is handled by repository with cache fallback
      const data = await mantraRepository.getAllMantras();

      // Get all aliases for this deity
      const searchKey = deity.toLowerCase();
      const aliases = DEITY_ALIASES[searchKey] || [deityName];

      // Filter for mantras where deity array contains any of the aliases
      const filtered = (data || []).filter((mantra) => {
        if (!mantra.deity) return false;
        const deityList = Array.isArray(mantra.deity) ? mantra.deity : [mantra.deity];
        return deityList.some((d: string) =>
          d && aliases.some(alias =>
            d.toLowerCase() === alias.toLowerCase()
          )
        );
      });

      setMantras(filtered);
    } catch (error) {
      console.error('Error fetching mantras:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [deity]);

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
          <Text style={styles.headerTitle}>{deityName}</Text>
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
              No mantras found for {deityName}
            </Text>
          </View>
        ) : (
          <View style={styles.mantraList}>
            {mantras.map((mantra) => (
              <MantraCard key={mantra.id} mantra={mantra} hideDeity={true} />
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
