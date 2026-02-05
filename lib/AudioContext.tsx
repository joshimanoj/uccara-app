/**
 * AudioContext for Uccara app
 * Global audio state management for persistent mini-player
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Mantra, Line } from './supabase';
import { getLocalAudioIfExists } from './downloadManager';
// Note: downloadManager uses expo-file-system/legacy for SDK 54 compatibility

const LOOP_STORAGE_KEY = '@uccara/loop_enabled';
const SPEED_STORAGE_KEY = '@uccara/playback_speed';

export interface AudioContextType {
  // Current mantra state
  currentMantra: Mantra | null;
  currentLines: Line[];
  currentLineIndex: number;

  // Playback state
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;
  isLooping: boolean;
  isPlayingOffline: boolean; // Whether current audio is playing from local storage

  // Actions
  loadMantra: (mantra: Mantra, lines: Line[]) => Promise<void>;
  playLine: (index: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  setPlaybackSpeed: (speed: number) => Promise<void>;
  cyclePlaybackSpeed: () => Promise<void>;
  setLooping: (enabled: boolean) => void;
  toggleLooping: () => void;
  seekTo: (position: number) => Promise<void>;
  pause: () => Promise<void>;
  cleanup: () => Promise<void>;
  setCurrentLineIndex: (index: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  // Mantra state
  const [currentMantra, setCurrentMantra] = useState<Mantra | null>(null);
  const [currentLines, setCurrentLines] = useState<Line[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlayingOffline, setIsPlayingOffline] = useState(false);

  // Refs
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioSessionRef = useRef(0);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [loopValue, speedValue] = await Promise.all([
          AsyncStorage.getItem(LOOP_STORAGE_KEY),
          AsyncStorage.getItem(SPEED_STORAGE_KEY),
        ]);

        if (loopValue !== null) {
          setIsLooping(loopValue === 'true');
        }
        if (speedValue !== null) {
          setPlaybackSpeedState(parseFloat(speedValue));
        }
      } catch (error) {
        console.error('Error loading audio preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Configure audio mode
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.error('Error configuring audio mode:', error);
      }
    };
    configureAudio();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadMantra = useCallback(async (mantra: Mantra, lines: Line[]) => {
    // Stop current audio if playing
    if (soundRef.current) {
      try {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    setCurrentMantra(mantra);
    setCurrentLines(lines);
    setCurrentLineIndex(0);
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  }, []);

  const playLine = useCallback(async (lineIndex: number) => {
    const line = currentLines[lineIndex];

    if (!line?.audio_url) {
      setIsPlaying(false);
      setIsPlayingOffline(false);
      return;
    }

    audioSessionRef.current += 1;
    const currentSession = audioSessionRef.current;

    // Stop existing audio
    if (soundRef.current) {
      try {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Ignore errors during cleanup
      }
      soundRef.current = null;
    }

    if (currentSession !== audioSessionRef.current) {
      return;
    }

    Haptics.selectionAsync();

    // Check for local file first (with fallback to streaming on error)
    let localPath: string | null = null;
    try {
      if (currentMantra) {
        console.log(`Checking local audio for mantra ${currentMantra.id}, line ${line.id}...`);
        localPath = await getLocalAudioIfExists(currentMantra.id, line.id);
        console.log(`Local path result: ${localPath || 'NOT FOUND'}`);
      }
    } catch (e) {
      console.log('Local file check failed, using streaming:', e);
      localPath = null;
    }

    // Determine audio source
    const audioSource = localPath ? { uri: localPath } : { uri: line.audio_url };
    setIsPlayingOffline(!!localPath);
    console.log('Playing audio from:', localPath ? 'LOCAL FILE' : 'STREAMING', audioSource.uri);

    // If no local file and we need to stream, check network first
    if (!localPath) {
      try {
        const response = await Promise.race([
          fetch('https://www.google.com', { method: 'HEAD' }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Network check timeout')), 2000))
        ]);
        console.log('Network check passed');
      } catch (networkError) {
        console.log('Network unavailable, cannot stream audio');
        setIsPlaying(false);
        Alert.alert(
          'Offline',
          'This mantra is not downloaded. Please connect to the internet or download it for offline use.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: true, rate: playbackSpeed, shouldCorrectPitch: true }
      );

      if (currentSession !== audioSessionRef.current) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      setIsPlaying(true);
      setCurrentLineIndex(lineIndex);

      // Log initial status
      const initialStatus = await sound.getStatusAsync();
      console.log('Audio loaded - duration:', initialStatus.isLoaded ? initialStatus.durationMillis : 'not loaded');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (currentSession !== audioSessionRef.current) {
          return;
        }

        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);

          if (status.didJustFinish) {
            console.log('Audio finished - line:', lineIndex, 'duration was:', status.durationMillis);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            if (isLooping) {
              // Replay current line
              sound.replayAsync();
            } else {
              // Auto-advance to next line
              if (lineIndex < currentLines.length - 1) {
                const nextIndex = lineIndex + 1;
                setCurrentLineIndex(nextIndex);
                setTimeout(() => {
                  if (currentSession === audioSessionRef.current) {
                    playLine(nextIndex);
                  }
                }, 50);
              } else {
                setIsPlaying(false);
                setPosition(0);
                soundRef.current = null;
              }
            }
          }
        }
      });
    } catch (error: any) {
      console.log('Error playing audio:', error.message || error);
      setIsPlaying(false);
      setIsPlayingOffline(false);

      // Show user-friendly alert
      Alert.alert(
        'Playback Error',
        'Could not play audio. Please check your internet connection or download the mantra for offline use.',
        [{ text: 'OK' }]
      );
    }
  }, [currentLines, currentMantra, playbackSpeed, isLooping]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.pauseAsync();
        // Only update state if we were actually playing to avoid extra renders
        setIsPlaying(prev => {
          if (prev) Haptics.selectionAsync();
          return false;
        });
      } catch (error) {
        console.log('Pause error:', error);
      }
    } else {
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    try {
      if (isPlaying) {
        await pause();
      } else {
        if (soundRef.current) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        } else {
          await playLine(currentLineIndex);
        }
        Haptics.selectionAsync();
      }
    } catch (error: any) {
      console.log('togglePlayPause error:', error.message || error);
      // Reset state if player doesn't exist
      setIsPlaying(false);
      soundRef.current = null;
    }
  }, [isPlaying, currentLineIndex, playLine, pause]);

  const skipToNext = useCallback(async () => {
    if (currentLineIndex < currentLines.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      audioSessionRef.current += 1;
      const wasPlaying = isPlaying;

      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);
      const newIndex = currentLineIndex + 1;
      setCurrentLineIndex(newIndex);

      if (wasPlaying) {
        await playLine(newIndex);
      }
    }
  }, [currentLineIndex, currentLines.length, isPlaying, playLine]);

  const skipToPrevious = useCallback(async () => {
    if (currentLineIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      audioSessionRef.current += 1;
      const wasPlaying = isPlaying;

      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);
      const newIndex = currentLineIndex - 1;
      setCurrentLineIndex(newIndex);

      if (wasPlaying) {
        await playLine(newIndex);
      }
    }
  }, [currentLineIndex, isPlaying, playLine]);

  const setPlaybackSpeed = useCallback(async (speed: number) => {
    setPlaybackSpeedState(speed);
    if (soundRef.current) {
      await soundRef.current.setRateAsync(speed, true);
    }
    await AsyncStorage.setItem(SPEED_STORAGE_KEY, speed.toString());
  }, []);

  const cyclePlaybackSpeed = useCallback(async () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    await setPlaybackSpeed(nextSpeed);
    Haptics.selectionAsync();
  }, [playbackSpeed, setPlaybackSpeed]);

  const setLoopingState = useCallback((enabled: boolean) => {
    setIsLooping(enabled);
    AsyncStorage.setItem(LOOP_STORAGE_KEY, enabled.toString());
    Haptics.selectionAsync();
  }, []);

  const toggleLooping = useCallback(() => {
    setLoopingState(!isLooping);
  }, [isLooping, setLoopingState]);

  const seekTo = useCallback(async (newPosition: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(newPosition);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    setIsPlaying(false);
    setIsPlayingOffline(false);
    setPosition(0);
    setDuration(0);
  }, []);

  const value: AudioContextType = {
    currentMantra,
    currentLines,
    currentLineIndex,
    isPlaying,
    position,
    duration,
    playbackSpeed,
    isLooping,
    isPlayingOffline,
    loadMantra,
    playLine,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    setPlaybackSpeed,
    cyclePlaybackSpeed,
    setLooping: setLoopingState,
    toggleLooping,
    seekTo,
    pause,
    cleanup,
    setCurrentLineIndex,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}
