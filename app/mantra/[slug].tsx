/**
 * Mantra Detail Screen for Uccara app
 * Force refresh: 1
 * Two modes: List View (Lines/Terms/Words) and Focus Mode (3-line lyrics)
 * Uses global AudioContext for persistent audio playback
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { useAudio } from '../../lib/AudioContext';
import { useDownload } from '../../lib/DownloadContext';
import { supabase, Mantra, Line, Term, Word, MantraWithDetails } from '../../lib/supabase';
import { useFavorites } from '../../lib/FavoritesContext';
import { mantraRepository } from '../../lib/DataRepository';
import {
  ChevronLeftIcon,
  BookmarkIcon,
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  MenuIcon,
  InfoIcon,
  DownloadIcon,
  CheckCircleIcon,
  TrashIcon,
} from '../../components/Icons';
import { useNetwork } from '../../lib/NetworkContext';

type TabType = 'lines' | 'terms' | 'words';
type ViewMode = 'list' | 'focus';



export default function MantraDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Audio context
  const {
    currentMantra,
    currentLines,
    currentLineIndex,
    isPlaying,
    playbackSpeed,
    loadMantra,
    playLine,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    cyclePlaybackSpeed,
    setCurrentLineIndex,
    pause,
    cleanup,
  } = useAudio();

  // Download context
  const {
    getDownloadStatus,
    getDownloadProgress,
    downloadMantra,
    deleteDownload,
  } = useDownload();

  // Network status
  const { isOffline } = useNetwork();

  // Local state
  const [mantra, setMantra] = useState<MantraWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeTab, setActiveTab] = useState<TabType>('lines');
  const [selectedLine, setSelectedLine] = useState<Line | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1.1)).current;

  // Fetch mantra data
  const fetchMantra = useCallback(async () => {
    if (!slug) return;

    // Debug: Fetching mantra details
    console.log('Fetching mantra details for slug:', slug);

    try {
      // Use repository for offline support
      const extendedMantra = await mantraRepository.getMantraBySlug(slug);

      if (!extendedMantra) throw new Error('Mantra not found');

      setMantra(extendedMantra);

      // Load into AudioContext
      const plainLines: Line[] = (extendedMantra.lines || []).map((line: any) => ({
        id: line.id,
        mantra_id: line.mantra_id,
        line_number: line.line_number,
        line_text: line.line_text,
        audio_url: line.audio_url,
        line_meaning: line.line_meaning,
      }));

      await loadMantra(extendedMantra, plainLines);
    } catch (error) {
      console.error('Error fetching mantra:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, user, loadMantra]);

  // Fetch on mount or slug change
  useEffect(() => {
    setActiveTab('lines');
    setSelectedLine(null);
    setSelectedTerm(null);
    setViewMode('list');
    fetchMantra();

    // Pause audio when leaving this screen
    return () => {
      pause();
    };
  }, [slug, pause]);

  // Check if any audio is available
  const hasAudio = mantra?.lines?.some(line => line.audio_url) || mantra?.audio_url;

  const animateLineChange = (callback: () => void) => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
    setTimeout(callback, 150);
  };

  const handleTogglePlayPause = async () => {
    await togglePlayPause();
  };

  const handleSkipToPrevious = async () => {
    animateLineChange(() => { });
    await skipToPrevious();
  };

  const handleSkipToNext = async () => {
    animateLineChange(() => { });
    await skipToNext();
  };

  const jumpToLine = async (index: number) => {
    if (mantra?.lines && index >= 0 && index < mantra.lines.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const wasPlaying = isPlaying;
      setCurrentLineIndex(index);
      animateLineChange(() => { });
      if (wasPlaying) {
        await playLine(index);
      }
    }
  };

  // Navigation handlers
  const handleBack = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pause();
    if (viewMode === 'focus') {
      setViewMode('list');
    } else if (activeTab === 'words') {
      setActiveTab('terms');
      setSelectedTerm(null);
    } else if (activeTab === 'terms') {
      setActiveTab('lines');
      setSelectedLine(null);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!mantra) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(mantra.id);
  };

  const selectLine = async (line: Line, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pause();
    setSelectedLine(line);
    setCurrentLineIndex(index);
    setActiveTab('terms');
  };

  const selectTerm = async (term: Term) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await pause();
    setSelectedTerm(term);
    setActiveTab('words');
  };

  // Download handlers
  const downloadStatus = mantra ? getDownloadStatus(mantra.id) : 'not_downloaded';
  const downloadProgress = mantra ? getDownloadProgress(mantra.id) : null;

  const handleDownload = async () => {
    if (isOffline && downloadStatus === 'not_downloaded') {
      Alert.alert('Offline Mode', 'You need an internet connection to download mantras.');
      return;
    }

    if (!mantra || !mantra.lines) {
      console.log('No mantra or lines:', { mantra: !!mantra, lines: mantra?.lines?.length });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (downloadStatus === 'downloaded') {
      // Show confirmation modal
      setShowDeleteConfirm(true);
    } else if (downloadStatus === 'not_downloaded') {
      // Start download
      const plainLines: Line[] = mantra.lines.map((line: any) => ({
        id: line.id,
        mantra_id: line.mantra_id,
        line_number: line.line_number,
        line_text: line.line_text,
        audio_url: line.audio_url,
        line_meaning: line.line_meaning,
      }));

      console.log('Downloading mantra:', mantra.id, mantra.title_primary);
      console.log('Lines count:', plainLines.length);
      console.log('Lines with audio:', plainLines.filter(l => l.audio_url).length);
      console.log('Sample audio URLs:', plainLines.slice(0, 3).map(l => l.audio_url));

      await downloadMantra(mantra, plainLines);
    }
  };

  const handleDeleteDownload = async () => {
    if (!mantra) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await deleteDownload(mantra.id);
    setShowDeleteConfirm(false);
  };

  const enterFocusMode = (lineIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentLineIndex(lineIndex);
    setViewMode('focus');
  };

  const styles = createStyles(theme, insets);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent.primary} />
      </View>
    );
  }
  if (!mantra) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mantra not found</Text>
        <Text style={styles.errorSubtext}>
          {isOffline
            ? 'This mantra detail is not yet available for offline use. Please connect to the internet to sync it.'
            : 'We could not find the mantra you are looking for.'}
        </Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const lines = (mantra.lines || []) as NonNullable<MantraWithDetails['lines']>;
  const linesCount = lines.length;

  // Cast selected line and term to their extended types for type safety
  const currentSelectedLine = selectedLine as NonNullable<MantraWithDetails['lines']>[0] | null;
  const currentSelectedTerm = selectedTerm as NonNullable<NonNullable<MantraWithDetails['lines']>[0]['terms']>[0] | null;

  const termsCount = currentSelectedLine?.terms?.length || 0;
  const wordsCount = currentSelectedTerm?.words?.length || 0;
  const deityText = Array.isArray(mantra.deity) ? mantra.deity.join(', ') : mantra.deity;

  // Focus Mode View
  if (viewMode === 'focus') {
    const prevLine = lines[currentLineIndex - 1];
    const currentLine = lines[currentLineIndex];
    const nextLine = lines[currentLineIndex + 1];

    return (
      <View style={styles.container}>
        {/* Focus Header */}
        <View style={styles.focusHeader}>
          <Text style={styles.focusTitle}>{mantra.title_primary}</Text>
          {/* Download Button in Focus Mode */}
          <Pressable
            style={styles.headerButton}
            onPress={handleDownload}
            disabled={downloadStatus === 'downloading'}
          >
            {downloadStatus === 'downloading' ? (
              <View style={styles.downloadProgress}>
                <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              </View>
            ) : downloadStatus === 'downloaded' ? (
              <CheckCircleIcon
                size={22}
                color={theme.colors.accent.primary}
                filled={true}
              />
            ) : (
              <DownloadIcon
                size={22}
                color={!isOffline ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
              />
            )}
          </Pressable>
        </View>

        {/* 3-Line Lyrics Stack */}
        <View style={styles.lyricsContainer}>
          {/* Previous Line */}
          <Pressable
            style={styles.inactiveLine}
            onPress={() => currentLineIndex > 0 && jumpToLine(currentLineIndex - 1)}
          >
            <Text style={styles.inactiveLineText}>
              {prevLine?.line_text || ''}
            </Text>
          </Pressable>

          {/* Active Line */}
          <Animated.View style={[styles.activeLine, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text
              style={styles.activeLineText}
              numberOfLines={4}
            >
              {currentLine?.line_text || ''}
            </Text>
            {currentLine?.line_meaning && (
              <Text
                style={styles.activeLineMeaning}
                numberOfLines={6}
              >
                {currentLine.line_meaning}
              </Text>
            )}
            <Pressable
              style={styles.exploreTermsButton}
              onPress={async () => {
                await pause();
                setSelectedLine(currentLine);
                setActiveTab('terms');
                setViewMode('list');
              }}
            >
              <Text style={styles.exploreTermsText}>Tap to explore terms</Text>
            </Pressable>
          </Animated.View>

          {/* Next Line */}
          <Pressable
            style={styles.inactiveLine}
            onPress={() => nextLine && jumpToLine(currentLineIndex + 1)}
          >
            <Text style={styles.inactiveLineText}>
              {nextLine?.line_text || ''}
            </Text>
          </Pressable>
        </View>

        {/* Integrated Audio Controller */}
        <View style={styles.audioController}>
          {/* Indicator Moved to Top */}
          <Text style={styles.lineIndicator}>
            Line {currentLineIndex + 1} of {linesCount}
          </Text>

          {/* Playback Controls with Speed and Menu Integrated */}
          <View style={styles.playbackControls}>
            <Pressable style={styles.speedSelector} onPress={cyclePlaybackSpeed}>
              <Text style={styles.speedText}>{playbackSpeed.toFixed(2)}x</Text>
            </Pressable>

            <View style={styles.mainControlsGroup}>
              <Pressable
                style={[styles.controlButton, currentLineIndex === 0 && styles.skipButtonDisabled]}
                onPress={handleSkipToPrevious}
                disabled={currentLineIndex === 0}
              >
                <SkipBackIcon size={24} color="#FFFFFF" />
              </Pressable>

              <Pressable
                style={[styles.mainPlayButton, !hasAudio && styles.playButtonDisabled]}
                onPress={hasAudio ? handleTogglePlayPause : undefined}
              >
                {isPlaying ? (
                  <PauseIcon size={32} color="#000000" />
                ) : (
                  <PlayIcon size={32} color="#000000" />
                )}
              </Pressable>

              <Pressable
                style={[styles.controlButton, currentLineIndex >= linesCount - 1 && styles.skipButtonDisabled]}
                onPress={handleSkipToNext}
                disabled={currentLineIndex >= linesCount - 1}
              >
                <SkipForwardIcon size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <Pressable
              style={styles.termToggle}
              onPress={async () => {
                setActiveTab('lines');
                setViewMode('list');
              }}
            >
              <MenuIcon size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // List Mode View
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={handleBack}>
          <ChevronLeftIcon size={24} color={theme.colors.text.primary} />
        </Pressable>
        <View style={styles.headerSpacer} />
        {/* Download Button */}
        <Pressable
          style={styles.headerButton}
          onPress={handleDownload}
          disabled={downloadStatus === 'downloading'}
        >
          {downloadStatus === 'downloading' ? (
            <View style={styles.downloadProgress}>
              <ActivityIndicator size="small" color={theme.colors.accent.primary} />
              {downloadProgress && (
                <Text style={styles.downloadProgressText}>
                  {downloadProgress.current}/{downloadProgress.total}
                </Text>
              )}
            </View>
          ) : downloadStatus === 'downloaded' ? (
            <CheckCircleIcon
              size={22}
              color={theme.colors.accent.primary}
              filled={true}
            />
          ) : (
            <DownloadIcon
              size={22}
              color={!isOffline ? theme.colors.text.primary : theme.colors.text.muted}
            />
          )}
        </Pressable>
        <Pressable
          style={styles.headerButton}
          onPress={handleSave}
        >
          <BookmarkIcon
            size={22}
            color={
              isFavorite(mantra.id)
                ? theme.colors.accent.primary
                : theme.colors.text.primary
            }
            filled={isFavorite(mantra.id)}
          />
        </Pressable>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{mantra.title_primary}</Text>
        <Text style={styles.subtitle}>
          {deityText} • {linesCount} lines
        </Text>
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.actionButton}
            onPress={() => setShowAboutModal(true)}
          >
            <InfoIcon size={18} color={theme.colors.text.secondary} />
            <Text style={styles.actionButtonText}>About</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'lines' && styles.tabActive]}
            onPress={() => {
              setActiveTab('lines');
              setSelectedLine(null);
              setSelectedTerm(null);
            }}
          >
            <Text style={[styles.tabText, activeTab === 'lines' && styles.tabTextActive]}>
              Lines
            </Text>
            <View style={[styles.tabBadge, activeTab === 'lines' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === 'lines' && styles.tabBadgeTextActive]}>
                {linesCount}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'terms' && styles.tabActive, !currentSelectedLine && styles.tabDisabled]}
            onPress={() => currentSelectedLine && setActiveTab('terms')}
            disabled={!currentSelectedLine}
          >
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive, !currentSelectedLine && styles.tabTextDisabled]}>
              Terms
            </Text>
            {currentSelectedLine && (
              <View style={[styles.tabBadge, activeTab === 'terms' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'terms' && styles.tabBadgeTextActive]}>
                  {termsCount}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'words' && styles.tabActive, !currentSelectedTerm && styles.tabDisabled]}
            onPress={() => currentSelectedTerm && setActiveTab('words')}
            disabled={!currentSelectedTerm}
          >
            <Text style={[styles.tabText, activeTab === 'words' && styles.tabTextActive, !currentSelectedTerm && styles.tabTextDisabled]}>
              Words
            </Text>
            {currentSelectedTerm && (
              <View style={[styles.tabBadge, activeTab === 'words' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'words' && styles.tabBadgeTextActive]}>
                  {wordsCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'lines' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeader}>ALL LINES</Text>
            {lines.map((line, index) => (
              <Pressable
                key={line.id}
                style={[styles.lineCard, currentSelectedLine?.id === line.id && styles.lineCardSelected]}
                onPress={() => selectLine(line, index)}
                onLongPress={() => enterFocusMode(index)}
              >
                <View style={styles.lineNumberBadge}>
                  <Text style={styles.lineNumberText}>{line.line_number}</Text>
                </View>
                <Text style={styles.lineText}>{line.line_text}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'terms' && currentSelectedLine && (
          <View style={styles.tabContent}>
            <Pressable style={styles.backNav} onPress={() => setActiveTab('lines')}>
              <ChevronLeftIcon size={18} color={theme.colors.text.secondary} />
              <Text style={styles.backNavText}>Line {currentSelectedLine.line_number}</Text>
            </Pressable>

            <View style={styles.contextCard}>
              <Text style={styles.contextSanskrit}>{currentSelectedLine.line_text}</Text>
              {currentSelectedLine.line_meaning && (
                <Text style={styles.contextMeaning}>{currentSelectedLine.line_meaning}</Text>
              )}
            </View>

            <Text style={styles.sectionHeader}>TERMS IN THIS LINE</Text>
            {currentSelectedLine.terms?.map((term: any) => (
              <Pressable
                key={term.id}
                style={styles.termCard}
                onPress={() => selectTerm(term)}
              >
                <Text style={styles.termHindi}>{term.hindi_term}</Text>
                <Text style={styles.termIast}>{term.english_term_iast}</Text>
                {term.pronunciation && (
                  <Text style={styles.termPronunciation}>{term.pronunciation}</Text>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'words' && currentSelectedTerm && (
          <View style={styles.tabContent}>
            <Pressable style={styles.backNav} onPress={() => setActiveTab('terms')}>
              <ChevronLeftIcon size={18} color={theme.colors.text.secondary} />
              <Text style={styles.backNavText}>WORDS IN</Text>
            </Pressable>

            <View style={styles.termHeader}>
              <Text style={styles.termHeaderHindi}>{currentSelectedTerm.hindi_term}</Text>
              <Text style={styles.termHeaderIast}>{currentSelectedTerm.english_term_iast}</Text>
            </View>

            {currentSelectedTerm.words?.map((word: any) => (
              <View key={word.id} style={styles.wordCard}>
                <Text style={styles.wordIast}>{word.word_iast}</Text>

                {word.meaning && (
                  <View style={styles.wordSection}>
                    <Text style={styles.wordLabel}>Meaning</Text>
                    <Text style={styles.wordMeaning}>{word.meaning}</Text>
                  </View>
                )}

                {word.etymology && (
                  <View style={styles.wordSection}>
                    <Text style={styles.wordLabel}>Etymology</Text>
                    <Text style={styles.wordEtymology}>{word.etymology}</Text>
                  </View>
                )}

                {word.root && (
                  <View style={styles.rootBadge}>
                    <Text style={styles.rootLabel}>ROOT</Text>
                    <Text style={styles.rootText}>{word.root}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Audio Player (Bottom Bar) */}
      <View style={styles.bottomBar}>
        <Text style={styles.bottomBarIndicator}>
          Line {currentLineIndex + 1} of {linesCount}
        </Text>
        <View style={styles.bottomBarControls}>
          <Pressable
            style={[styles.bottomBarButton, currentLineIndex === 0 && styles.bottomBarButtonDisabled]}
            onPress={handleSkipToPrevious}
            disabled={currentLineIndex === 0}
          >
            <SkipBackIcon size={24} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <Pressable
            style={styles.bottomBarPlayButton}
            onPress={handleTogglePlayPause}
          >
            {isPlaying ? (
              <PauseIcon size={28} color="#000000" />
            ) : (
              <PlayIcon size={28} color="#000000" />
            )}
          </Pressable>

          <Pressable
            style={[styles.bottomBarButton, currentLineIndex >= linesCount - 1 && styles.bottomBarButtonDisabled]}
            onPress={handleSkipToNext}
            disabled={currentLineIndex >= linesCount - 1}
          >
            <SkipForwardIcon size={24} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <Pressable
            style={styles.bottomBarExpand}
            onPress={() => setViewMode('focus')}
          >
            <Text style={styles.expandIcon}>⛶</Text>
          </Pressable>
        </View>
      </View>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>About</Text>
            <Pressable onPress={() => setShowAboutModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalMantraTitle}>{mantra.title_primary}</Text>

            {mantra.significance && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Significance</Text>
                <Text style={styles.modalSectionText}>{mantra.significance}</Text>
              </View>
            )}

            {mantra.benefits_traditional && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Traditional Benefits</Text>
                <Text style={styles.modalSectionText}>{mantra.benefits_traditional}</Text>
              </View>
            )}

            {mantra.when_to_recite && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>When to Recite</Text>
                {mantra.when_to_recite.time && (
                  <Text style={styles.modalSectionText}>Time: {mantra.when_to_recite.time}</Text>
                )}
                {mantra.when_to_recite.frequency && (
                  <Text style={styles.modalSectionText}>Frequency: {mantra.when_to_recite.frequency}</Text>
                )}
              </View>
            )}

            {mantra.how_to_chant && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>How to Chant</Text>
                {mantra.how_to_chant.posture && (
                  <Text style={styles.modalSectionText}>Posture: {mantra.how_to_chant.posture}</Text>
                )}
                {mantra.how_to_chant.focus && (
                  <Text style={styles.modalSectionText}>Focus: {mantra.how_to_chant.focus}</Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Download Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <TrashIcon size={32} color={theme.colors.text.secondary} />
            <Text style={styles.deleteModalTitle}>Remove Download?</Text>
            <Text style={styles.deleteModalText}>
              This will remove the offline audio for "{mantra.title_primary}". You can download it again anytime.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Pressable
                style={styles.deleteModalCancelButton}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteDownload}
              >
                <Text style={styles.deleteModalConfirmText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background.page },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.page },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background.page },
    errorText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 16, color: theme.colors.text.secondary },
    errorSubtext: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 14,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 40,
    },
    backLink: { marginTop: 16 },
    backLinkText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 16, color: theme.colors.accent.primary },

    // Header
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8 },
    headerButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    headerSpacer: { flex: 1 },

    // Title Section
    titleSection: { paddingHorizontal: 20, paddingBottom: 16 },
    title: { fontFamily: theme.fontFamilies.primary.bold, fontSize: 28, color: theme.colors.text.primary, marginBottom: 4 },
    subtitle: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 14, color: theme.colors.text.secondary, marginBottom: 12 },
    actionButtons: { flexDirection: 'row', gap: 12 },
    actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: theme.colors.background.elevated, borderRadius: 20 },
    actionButtonIcon: { fontSize: 14 },
    actionButtonText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 13, color: theme.colors.text.secondary },

    // Tabs
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.divider },
    tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent', gap: 6 },
    tabActive: { borderBottomColor: theme.colors.text.primary },
    tabDisabled: { opacity: 0.4 },
    tabText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 15, color: theme.colors.text.secondary },
    tabTextActive: { color: theme.colors.text.primary },
    tabTextDisabled: { color: theme.colors.text.muted },
    tabBadge: { backgroundColor: theme.colors.background.elevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    tabBadgeActive: { backgroundColor: theme.colors.text.primary },
    tabBadgeText: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 12, color: theme.colors.text.secondary },
    tabBadgeTextActive: { color: '#FFFFFF' },

    // Content
    content: { flex: 1 },
    contentContainer: { paddingBottom: 120 },
    tabContent: { padding: 20 },
    sectionHeader: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 12, color: theme.colors.text.muted, letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },

    // Back Navigation
    backNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
    backNavText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 14, color: theme.colors.text.secondary },

    // Context Card
    contextCard: { backgroundColor: theme.colors.background.cardSolid, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.ui.divider },
    contextSanskrit: { fontFamily: theme.fontFamilies.devanagari.medium, fontSize: 18, color: theme.colors.text.primary, lineHeight: 28, marginBottom: 8 },
    contextMeaning: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },

    // Line Card
    lineCard: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.divider, gap: 12 },
    lineCardSelected: { backgroundColor: theme.colors.accent.focus },
    lineNumberBadge: { width: 28, height: 28, borderRadius: 4, backgroundColor: theme.colors.background.elevated, justifyContent: 'center', alignItems: 'center' },
    lineNumberText: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 13, color: theme.colors.text.primary },
    lineText: { flex: 1, fontFamily: theme.fontFamilies.devanagari.medium, fontSize: 17, color: theme.colors.text.primary, lineHeight: 26 },

    // Term Card
    termCard: { backgroundColor: theme.colors.background.cardSolid, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.ui.divider },
    termHindi: { fontFamily: theme.fontFamilies.devanagari.semiBold, fontSize: 22, color: theme.colors.text.primary, marginBottom: 4 },
    termIast: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 15, color: theme.colors.text.secondary, marginBottom: 2 },
    termPronunciation: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 13, color: theme.colors.text.muted },

    // Term Header
    termHeader: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.divider },
    termHeaderHindi: { fontFamily: theme.fontFamilies.devanagari.semiBold, fontSize: 24, color: theme.colors.text.primary, marginBottom: 4 },
    termHeaderIast: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 16, color: theme.colors.text.secondary },

    // Word Card
    wordCard: { backgroundColor: theme.colors.background.cardSolid, padding: 20, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.ui.divider },
    wordIast: { fontFamily: theme.fontFamilies.primary.bold, fontSize: 24, color: theme.colors.text.primary, marginBottom: 16 },
    wordSection: { marginBottom: 16 },
    wordLabel: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 12, color: theme.colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    wordMeaning: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 16, color: theme.colors.text.primary, lineHeight: 24 },
    wordEtymology: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },
    rootBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.background.elevated, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
    rootLabel: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 11, color: theme.colors.text.muted },
    rootText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 14, color: theme.colors.text.primary },

    // Focus Mode
    focusHeader: { flexDirection: 'row', alignItems: 'center', paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 16 },
    focusTitle: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 18, color: theme.colors.text.primary, flex: 1, textAlign: 'center' },
    viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.colors.background.elevated, borderRadius: 20 },
    viewAllText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 14, color: theme.colors.text.secondary },

    lyricsContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 50 },
    inactiveLine: { paddingVertical: 10, opacity: 0.3 },
    inactiveLineText: { fontFamily: theme.fontFamilies.devanagari.medium, fontSize: 18, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 28 },
    activeLine: {
      backgroundColor: theme.colors.background.elevated,
      paddingVertical: 24,
      paddingHorizontal: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.ui.border,
      alignItems: 'center',
      minHeight: 220,
      justifyContent: 'center',
    },
    activeLineText: { fontFamily: theme.fontFamilies.devanagari.bold, fontSize: 22, color: theme.colors.text.primary, textAlign: 'center', lineHeight: 32, marginBottom: 12 },
    activeLineMeaning: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    exploreTermsButton: { paddingVertical: 8, marginTop: 4 },
    exploreTermsText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 14, color: theme.colors.accent.primary },

    // Audio Controller (Focus Mode)
    audioController: { paddingBottom: insets.bottom + 20, paddingHorizontal: 24, backgroundColor: '#000000' },
    progressBarContainer: { marginBottom: 24 },
    progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, position: 'relative' },
    progressFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },
    progressKnob: { position: 'absolute', top: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', marginLeft: -8 },
    timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeLabel: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 12, color: 'rgba(255,255,255,0.5)' },

    playbackControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 20
    },
    mainControlsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 32,
      flex: 1,
      justifyContent: 'center',
    },
    mainPlayButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', ...theme.shadows.md },
    controlButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    skipButtonDisabled: { opacity: 0.3 },
    playButtonDisabled: { opacity: 0.5 },

    speedSelector: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, minWidth: 50, alignItems: 'center' },
    speedText: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 13, color: '#FFFFFF' },
    lineIndicator: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 12, paddingTop: 16 },
    termToggle: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    // List Mode Player (Bottom Bar)
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#000000',
      borderTopWidth: 0,
      paddingBottom: insets.bottom + 12,
      paddingTop: 16,
      alignItems: 'center',
    },
    bottomBarIndicator: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      textAlign: 'center',
      marginBottom: 20,
    },
    bottomBarControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
    bottomBarButton: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 12,
    },
    bottomBarButtonDisabled: {
      opacity: 0.3,
    },
    bottomBarPlayButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 12,
      ...theme.shadows.md,
    },
    bottomBarExpand: {
      position: 'absolute',
      right: 20,
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },

    // Modal
    modalContainer: { flex: 1, backgroundColor: theme.colors.background.page },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.ui.divider },
    modalTitle: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 18, color: theme.colors.text.primary },
    modalClose: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 16, color: theme.colors.accent.primary },
    modalContent: { flex: 1, padding: 20 },
    modalMantraTitle: { fontFamily: theme.fontFamilies.primary.bold, fontSize: 24, color: theme.colors.text.primary, marginBottom: 24 },
    modalSection: { marginBottom: 24 },
    modalSectionTitle: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 16, color: theme.colors.text.primary, marginBottom: 8 },
    modalSectionText: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 15, color: theme.colors.text.secondary, lineHeight: 24 },

    // Download Progress
    downloadProgress: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    downloadProgressText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 10, color: theme.colors.accent.primary },

    // Delete Modal
    deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    deleteModalContent: { backgroundColor: theme.colors.background.cardSolid, borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
    deleteModalTitle: { fontFamily: theme.fontFamilies.primary.semiBold, fontSize: 18, color: theme.colors.text.primary, marginTop: 16, marginBottom: 8 },
    deleteModalText: { fontFamily: theme.fontFamilies.primary.regular, fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    deleteModalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    deleteModalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.background.elevated, alignItems: 'center' },
    deleteModalCancelText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 15, color: theme.colors.text.primary },
    deleteModalConfirmButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center' },
    deleteModalConfirmText: { fontFamily: theme.fontFamilies.primary.medium, fontSize: 15, color: '#FFFFFF' },
  });
