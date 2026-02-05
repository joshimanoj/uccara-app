/**
 * Saved Mantras Screen for Uccara app
 * Matches mockup: title with count, filter pills, saved items list, empty state
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { useFavorites } from '../../lib/FavoritesContext';
import { useNetwork } from '../../lib/NetworkContext';
import { supabase, Mantra, DeityMapping } from '../../lib/supabase';
import { mantraRepository } from '../../lib/DataRepository';

import {
  BookmarkIcon,
  TridentIcon,
  ModakIcon,
  MoonIcon,
  FluteIcon,
  MaceIcon,
  ConchIcon,
  BookIcon,
  OwlEyesIcon,
} from '../../components/Icons';

// Map deity names to accent color keys and icon colors
const DEITY_COLORS: Record<string, { bg: string; fg: string }> = {
  ganesha: { bg: 'mint', fg: 'green' },
  ganapati: { bg: 'mint', fg: 'green' },
  vinayaka: { bg: 'mint', fg: 'green' },

  shiva: { bg: 'lavender', fg: 'purple' },
  rudra: { bg: 'lavender', fg: 'purple' },
  tryambaka: { bg: 'lavender', fg: 'purple' },
  mahadeva: { bg: 'lavender', fg: 'purple' },

  krishna: { bg: 'gold', fg: 'gold' },
  govinda: { bg: 'gold', fg: 'gold' },
  achyuta: { bg: 'gold', fg: 'gold' },

  durga: { bg: 'peach', fg: 'warm' },
  devi: { bg: 'peach', fg: 'warm' },
  ambika: { bg: 'peach', fg: 'warm' },
  chandi: { bg: 'peach', fg: 'warm' },
  kali: { bg: 'peach', fg: 'warm' },

  hanuman: { bg: 'blush', fg: 'rose' },
  maruti: { bg: 'blush', fg: 'rose' },

  vishnu: { bg: 'cream', fg: 'brown' },
  narayana: { bg: 'cream', fg: 'brown' },
  rama: { bg: 'cream', fg: 'brown' },

  saraswati: { bg: 'lavender', fg: 'purple' },
  lakshmi: { bg: 'gold', fg: 'gold' },
};

function getDeityColorKey(deity: string[] | undefined): { bg: string; fg: string } {
  if (!deity || deity.length === 0) return { bg: 'cream', fg: 'brown' };
  const primary = deity[0].toLowerCase();
  return DEITY_COLORS[primary] || { bg: 'cream', fg: 'brown' };
}

function getDeityIcon(deityName: string, color: string, size: number, mapping: Record<string, string> = {}) {
  let name = deityName?.toLowerCase();

  // Normalize using DB mapping if available
  if (mapping[name]) {
    name = mapping[name].toLowerCase();
  }

  // Hardcoded fallbacks (for offline/initial load safety or if DB is incomplete)
  if (['shiva', 'rudra', 'tryambaka', 'mahadeva', 'maheswara', 'bholenath', 'nataraja', 'vaidyanatha'].includes(name)) return <MoonIcon size={size} color={color} />;
  if (['ganesha', 'ganapati', 'vinayaka', 'vighnaharta'].includes(name)) return <ModakIcon size={size} color={color} />;
  if (['durga', 'devi', 'ambika', 'chandi', 'kali', 'parvati', 'mahishasuramardini'].includes(name)) return <TridentIcon size={size} color={color} />;
  if (['krishna', 'govinda', 'gopala', 'achyuta', 'damodara'].includes(name)) return <FluteIcon size={size} color={color} />;
  if (['hanuman', 'maruti', 'anjaneya', 'bajrang', 'sankata mochana'].includes(name)) return <MaceIcon size={size} color={color} />;
  if (['vishnu', 'narayana', 'rama', 'hari', 'balaji', 'venkateswara', 'srinivasa'].includes(name)) return <ConchIcon size={size} color={color} />;
  if (['saraswati', 'sharada', 'vani'].includes(name)) return <BookIcon size={size} color={color} />;
  if (['lakshmi', 'kamala', 'shri', 'sri', 'mahalakshmi'].includes(name)) return <OwlEyesIcon size={size} color={color} />;

  return <BookmarkIcon size={size} color={color} filled />;
}

export default function SavedScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isOnline } = useNetwork();
  const { favorites, toggleFavorite, isLoading: favoritesLoading } = useFavorites();
  const insets = useSafeAreaInsets();
  const [savedMantras, setSavedMantras] = useState<Mantra[]>([]);
  const [deityMappings, setDeityMappings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  // Fetch deity mappings on mount
  useEffect(() => {
    const loadMappings = async () => {
      const mappings = await mantraRepository.getDeityMappings();
      const map: Record<string, string> = {
        // Fallback hardcoded mappings (in case DB is missing them)
        'jnaneshwara': 'Krishna', // Vithoba/Krishna
        'dnyaneshwar': 'Krishna',
        'tukaram': 'Krishna',
        'namdev': 'Krishna',
        'ekanath': 'Krishna',
        'vithoba': 'Krishna',
        'panduranga': 'Krishna',
      };

      mappings.forEach(m => {
        map[m.secondary_name.toLowerCase()] = m.primary_name;
      });
      setDeityMappings(map);
    };
    loadMappings();
  }, []);

  // Reset filter to 'All' if offline (since filters are disabled)
  useEffect(() => {
    if (!isOnline && activeFilter !== 'All') {
      setActiveFilter('All');
    }
  }, [isOnline]);

  const fetchSavedMantras = useCallback(async () => {
    if (favorites.length === 0) {
      setSavedMantras([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      // Use repository for both online and offline support
      const data = await mantraRepository.getMantrasByIds(favorites);

      // Sort according to favorites order (most recent first)
      const sortedMantras = [...data].sort((a, b) => {
        return favorites.indexOf(b.id) - favorites.indexOf(a.id);
      });


      setSavedMantras(sortedMantras);
    } catch (error) {
      console.error('Error fetching saved mantras:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [favorites]);

  useFocusEffect(
    useCallback(() => {
      fetchSavedMantras();
    }, [fetchSavedMantras])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchSavedMantras();
  }, [fetchSavedMantras]);

  const handleUnsave = async (mantraId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(mantraId);
  };

  const handleMantraPress = (slug: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!slug) {
      console.warn('Cannot navigate: mantra slug is missing');
      Alert.alert('Error', 'This mantra detail is currently unavailable.');
      return;
    }
    router.push(`/mantra/${slug}`);
  };

  const handleFilterPress = (filter: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  // Extract unique deity names for filter pills
  const deityFilters = useMemo(() => {
    const deities = new Set<string>();
    savedMantras.forEach((m) => {
      if (m.deity) {
        m.deity.forEach((d) => {
          const lowerName = d.toLowerCase();
          // Use primary name from mapping, or capitalize the original
          const primaryName = deityMappings[lowerName] || (d.charAt(0).toUpperCase() + d.slice(1).toLowerCase());
          deities.add(primaryName);
        });
      }
    });
    return ['All', ...Array.from(deities).sort()];
  }, [savedMantras, deityMappings]);

  // Filter mantras by selected deity
  const filteredMantras = useMemo(() => {
    if (activeFilter === 'All') return savedMantras;
    return savedMantras.filter((m) =>
      m.deity?.some((d) => {
        const lowerName = d.toLowerCase();
        const primary = deityMappings[lowerName] || (d.charAt(0).toUpperCase() + d.slice(1).toLowerCase());
        return primary.toLowerCase() === activeFilter.toLowerCase();
      })
    );
  }, [savedMantras, activeFilter, deityMappings]);

  const s = createStyles(theme, insets);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.accent.primary}
        />
      }
    >
      {/* Title Row */}
      <View style={s.titleRow}>
        <Text style={s.pageTitle}>Saved</Text>
        {savedMantras.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>
              {filteredMantras.length} {filteredMantras.length === 1 ? 'mantra' : 'mantras'}
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.accent.primary}
          style={s.loader}
        />
      ) : savedMantras.length === 0 ? (
        /* Empty State */
        <View style={s.emptyState}>
          <View style={s.emptyIllustration}>
            <BookmarkIcon size={56} color={theme.colors.iconFg.purple} />
          </View>
          <Text style={s.emptyTitle}>No saved mantras yet</Text>
          <Text style={s.emptyText}>
            Tap the bookmark icon on any mantra to save it here for quick access
          </Text>
        </View>
      ) : (
        <>
          {/* Filter Pills */}
          {deityFilters.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterScroll}
              contentContainerStyle={s.filterContainer}
            >
              {deityFilters.map((filter) => (
                <Pressable
                  key={filter}
                  disabled={!isOnline}
                  style={[
                    s.filterPill,
                    activeFilter === filter && s.filterPillActive,
                    !isOnline && s.filterPillDisabled,
                  ]}
                  onPress={() => handleFilterPress(filter)}
                >
                  <Text
                    style={[
                      s.filterText,
                      activeFilter === filter && s.filterTextActive,
                      !isOnline && s.filterTextDisabled,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Saved Items List */}
          <View style={s.savedList}>
            {filteredMantras.map((mantra) => {
              const colorKey = getDeityColorKey(mantra.deity);
              const bgColor = (theme.colors.softAccent as any)[colorKey.bg];
              const fgColor = (theme.colors.iconFg as any)[colorKey.fg];

              return (
                <Pressable
                  key={mantra.id}
                  style={s.savedItem}
                  onPress={() => handleMantraPress(mantra.slug)}
                >
                  <View style={[s.savedIconWrap, { backgroundColor: bgColor }]}>
                    {getDeityIcon(mantra.deity?.[0] || '', fgColor, 22, deityMappings)}
                  </View>
                  <Text style={s.savedTitle} numberOfLines={1}>
                    {mantra.title_primary}
                  </Text>
                  <Pressable
                    onPress={() => handleUnsave(mantra.id)}
                    hitSlop={8}
                  >
                    <BookmarkIcon
                      size={20}
                      color={theme.colors.iconFg.gold}
                      filled
                    />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
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

    // Title Row
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 8,
    },
    pageTitle: {
      fontFamily: theme.fontFamilies.display.semiBold,
      fontSize: 30,
      color: theme.colors.text.primary,
      letterSpacing: -0.5,
    },
    countBadge: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#eeebe7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    countText: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 13,
      color: theme.colors.text.secondary,
    },

    // Filter Pills
    filterScroll: {
      marginBottom: 20,
      marginHorizontal: -24,
    },
    filterContainer: {
      paddingHorizontal: 24,
      gap: 8,
    },
    filterPill: {
      backgroundColor: theme.colors.background.cardSolid,
      borderWidth: 1,
      borderColor: theme.colors.ui.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterPillActive: {
      backgroundColor: theme.colors.text.primary,
      borderColor: theme.colors.text.primary,
    },
    filterPillDisabled: {
      opacity: 0.4,
      backgroundColor: theme.colors.ui.disabled,
      borderColor: theme.colors.ui.border,
    },
    filterText: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 12.5,
      color: theme.colors.text.secondary,
    },
    filterTextActive: {
      color: theme.colors.text.inverse,
    },
    filterTextDisabled: {
      color: theme.colors.text.disabled,
    },

    // Saved Items
    savedList: {
      gap: 12,
    },
    savedItem: {
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 18,
      padding: 14,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      ...theme.shadows.md,
    },
    savedIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedTitle: {
      flex: 1,
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 14,
      color: theme.colors.text.primary,
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 60,
    },
    emptyIllustration: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.softAccent.lavender,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    emptyTitle: {
      fontFamily: theme.fontFamilies.display.semiBold,
      fontSize: 22,
      color: theme.colors.text.primary,
      marginBottom: 8,
    },
    emptyText: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 260,
    },

    // Loader
    loader: {
      marginTop: 60,
    },
  });
