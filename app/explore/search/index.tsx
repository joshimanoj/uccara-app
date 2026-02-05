/**
 * Search Screen for Uccara app
 * Allows searching through mantras
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../../theme/ThemeContext';
import { supabase, Mantra } from '../../../lib/supabase';
import MantraCard from '../../../components/MantraCard';
import { ChevronLeftIcon, SearchIcon } from '../../../components/Icons';

export default function SearchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [mantras, setMantras] = useState<Mantra[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchMantras = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMantras([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('mantras')
        .select('id, slug, title_primary, deity, intro_lines_devanagari')
        .eq('show_on_ui', 1)
        .or(`title_primary.ilike.%${searchQuery}%,title_alternatives.ilike.%${searchQuery}%`)
        .order('title_primary')
        .limit(20);

      if (error) throw error;
      setMantras(data || []);
    } catch (error) {
      console.error('Error searching mantras:', error);
      setMantras([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = () => {
    Keyboard.dismiss();
    searchMantras(query);
  };

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
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={theme.colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search mantras..."
            placeholderTextColor={theme.colors.text.muted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={theme.colors.accent.primary}
            style={styles.loader}
          />
        ) : !hasSearched ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Search for mantras by name
            </Text>
          </View>
        ) : mantras.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No mantras found for "{query}"
            </Text>
          </View>
        ) : (
          <View style={styles.mantraList}>
            <Text style={styles.resultCount}>
              {mantras.length} {mantras.length === 1 ? 'result' : 'results'}
            </Text>
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
      gap: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.elevated,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: theme.fontFamilies.primary.regular,
      fontWeight: '400',
      fontSize: 16,
      color: theme.colors.text.primary,
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
    resultCount: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontWeight: '500',
      fontSize: 14,
      color: theme.colors.text.secondary,
      marginBottom: 8,
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
      textAlign: 'center',
    },
  });
