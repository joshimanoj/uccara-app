/**
 * PlayerControls component for Uccara app
 * Shared play/pause/skip controls used in MiniPlayer and full player
 */

import { View, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { useAudio } from '../lib/AudioContext';
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  RepeatOneIcon,
} from './Icons';

interface PlayerControlsProps {
  size?: 'small' | 'medium' | 'large';
  showSkip?: boolean;
  showLoop?: boolean;
  showSpeed?: boolean;
  invertColors?: boolean;
}

export default function PlayerControls({
  size = 'medium',
  showSkip = true,
  showLoop = false,
  showSpeed = false,
  invertColors = false,
}: PlayerControlsProps) {
  const { theme } = useTheme();
  const {
    isPlaying,
    isLooping,
    playbackSpeed,
    currentLineIndex,
    currentLines,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    toggleLooping,
    cyclePlaybackSpeed,
  } = useAudio();

  const hasAudio = currentLines.some(line => line.audio_url);
  const canSkipPrev = currentLineIndex > 0;
  const canSkipNext = currentLineIndex < currentLines.length - 1;

  const sizes = {
    small: { play: 32, skip: 20, button: 40 },
    medium: { play: 48, skip: 24, button: 48 },
    large: { play: 64, skip: 28, button: 56 },
  };

  const currentSize = sizes[size];
  const primaryColor = invertColors ? '#FFFFFF' : theme.colors.text.primary;
  const playButtonBg = invertColors ? '#FFFFFF' : theme.colors.text.primary;
  const playButtonIconColor = invertColors ? '#000000' : '#FFFFFF';

  const styles = createStyles(theme, currentSize, invertColors);

  return (
    <View style={styles.container}>
      {showSpeed && (
        <Pressable style={styles.speedButton} onPress={cyclePlaybackSpeed}>
          <Text style={styles.speedText}>{playbackSpeed.toFixed(2)}x</Text>
        </Pressable>
      )}

      <View style={styles.mainControls}>
        {showSkip && (
          <Pressable
            style={[styles.skipButton, !canSkipPrev && styles.disabled]}
            onPress={skipToPrevious}
            disabled={!canSkipPrev}
          >
            <SkipBackIcon size={currentSize.skip} color={primaryColor} />
          </Pressable>
        )}

        <Pressable
          style={[styles.playButton, !hasAudio && styles.playButtonDisabled]}
          onPress={hasAudio ? togglePlayPause : undefined}
        >
          {isPlaying ? (
            <PauseIcon size={currentSize.play * 0.5} color={playButtonIconColor} />
          ) : (
            <PlayIcon size={currentSize.play * 0.5} color={playButtonIconColor} />
          )}
        </Pressable>

        {showSkip && (
          <Pressable
            style={[styles.skipButton, !canSkipNext && styles.disabled]}
            onPress={skipToNext}
            disabled={!canSkipNext}
          >
            <SkipForwardIcon size={currentSize.skip} color={primaryColor} />
          </Pressable>
        )}
      </View>

      {showLoop && (
        <Pressable style={styles.loopButton} onPress={toggleLooping}>
          <RepeatOneIcon
            size={20}
            color={isLooping ? theme.colors.accent.primary : primaryColor}
          />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (theme: any, size: any, invertColors: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mainControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    playButton: {
      width: size.play,
      height: size.play,
      borderRadius: size.play / 2,
      backgroundColor: invertColors ? '#FFFFFF' : theme.colors.text.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.shadows.md,
    },
    playButtonDisabled: {
      opacity: 0.5,
    },
    skipButton: {
      width: size.button,
      height: size.button,
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabled: {
      opacity: 0.3,
    },
    speedButton: {
      position: 'absolute',
      left: 0,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: invertColors ? 'rgba(255,255,255,0.1)' : theme.colors.background.elevated,
      borderRadius: 12,
    },
    speedText: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 12,
      color: invertColors ? '#FFFFFF' : theme.colors.text.primary,
    },
    loopButton: {
      position: 'absolute',
      right: 0,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
