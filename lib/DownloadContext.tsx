/**
 * DownloadContext for Uccara app
 * Manages download state for offline audio playback
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

import { Mantra, Line } from './supabase';
import {
  downloadAudio,
  deleteMantraAudio,
  getDownloadedMantras,
  saveDownloadMetadata,
  isMantraFullyDownloaded,
  getDownloadedFileSize,
  DownloadedMantrasMap,
} from './downloadManager';

export type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded' | 'error';

export interface DownloadProgress {
  current: number;
  total: number;
  lineProgress: number; // 0-1 progress of current line
}

export interface DownloadContextType {
  // State
  downloadedMantras: DownloadedMantrasMap;
  activeDownloads: Map<number, DownloadProgress>;

  // Actions
  downloadMantra: (mantra: Mantra, lines: Line[]) => Promise<void>;
  deleteDownload: (mantraId: number) => Promise<void>;
  cancelDownload: (mantraId: number) => void;

  // Status helpers
  getDownloadStatus: (mantraId: number) => DownloadStatus;
  getDownloadProgress: (mantraId: number) => DownloadProgress | null;
  isMantraDownloaded: (mantraId: number) => boolean;

  // Refresh
  refreshDownloadedMantras: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export function useDownload() {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}

interface DownloadProviderProps {
  children: ReactNode;
}

export function DownloadProvider({ children }: DownloadProviderProps) {
  const [downloadedMantras, setDownloadedMantras] = useState<DownloadedMantrasMap>({});
  const [activeDownloads, setActiveDownloads] = useState<Map<number, DownloadProgress>>(
    new Map()
  );
  const [cancelledDownloads, setCancelledDownloads] = useState<Set<number>>(new Set());

  // Load downloaded mantras on mount
  useEffect(() => {
    refreshDownloadedMantras();
  }, []);

  const refreshDownloadedMantras = useCallback(async () => {
    const mantras = await getDownloadedMantras();
    setDownloadedMantras(mantras);
  }, []);

  const downloadMantra = useCallback(
    async (mantra: Mantra, lines: Line[]) => {
      const mantraId = mantra.id;

      // Filter lines with audio URLs
      const linesWithAudio = lines.filter((line) => line.audio_url);

      if (linesWithAudio.length === 0) {
        console.warn('No audio lines to download for mantra:', mantraId);
        return;
      }

      // Check if already downloading
      if (activeDownloads.has(mantraId)) {
        console.warn('Already downloading mantra:', mantraId);
        return;
      }

      // Initialize download progress
      setActiveDownloads((prev) => {
        const next = new Map(prev);
        next.set(mantraId, { current: 0, total: linesWithAudio.length, lineProgress: 0 });
        return next;
      });

      // Remove from cancelled set if was cancelled before
      setCancelledDownloads((prev) => {
        const next = new Set(prev);
        next.delete(mantraId);
        return next;
      });

      let totalSize = 0;
      let completedCount = 0;

      try {
        console.log('Starting download for mantra:', mantraId, 'Lines with audio:', linesWithAudio.length);

        for (const line of linesWithAudio) {
          // Check if cancelled
          if (cancelledDownloads.has(mantraId)) {
            console.log('Download cancelled for mantra:', mantraId);
            break;
          }

          if (!line.audio_url) {
            console.log('Skipping line without audio_url:', line.id);
            continue;
          }

          console.log('Downloading line:', line.id, 'URL:', line.audio_url);

          await downloadAudio(
            line.audio_url,
            mantraId,
            line.id,
            (progress) => {
              setActiveDownloads((prev) => {
                const next = new Map(prev);
                const current = next.get(mantraId);
                if (current) {
                  next.set(mantraId, { ...current, lineProgress: progress });
                }
                return next;
              });
            }
          );

          console.log('Downloaded line:', line.id);

          // Get file size for metadata
          const fileSize = await getDownloadedFileSize(mantraId, line.id);
          totalSize += fileSize;

          completedCount++;
          setActiveDownloads((prev) => {
            const next = new Map(prev);
            next.set(mantraId, {
              current: completedCount,
              total: linesWithAudio.length,
              lineProgress: 1,
            });
            return next;
          });
        }

        // Check if cancelled during download
        if (!cancelledDownloads.has(mantraId)) {
          // Verify all files were downloaded
          const lineIds = linesWithAudio.map((l) => l.id);
          const fullyDownloaded = await isMantraFullyDownloaded(mantraId, lineIds);

          if (fullyDownloaded) {
            // Save metadata
            await saveDownloadMetadata(mantraId, linesWithAudio.length, totalSize, mantra.title_primary, mantra.slug);

            // Update downloaded mantras state
            await refreshDownloadedMantras();
          }
        }
      } catch (error: any) {
        console.error('Error downloading mantra:', mantraId);
        console.error('Error details:', error?.message || error);
        console.error('Full error:', JSON.stringify(error, null, 2));
      } finally {
        // Remove from active downloads
        setActiveDownloads((prev) => {
          const next = new Map(prev);
          next.delete(mantraId);
          return next;
        });
      }
    },
    [activeDownloads, cancelledDownloads, refreshDownloadedMantras]
  );

  const deleteDownload = useCallback(
    async (mantraId: number) => {
      try {
        await deleteMantraAudio(mantraId);
        await refreshDownloadedMantras();
      } catch (error) {
        console.error('Error deleting download:', mantraId, error);
      }
    },
    [refreshDownloadedMantras]
  );

  const cancelDownload = useCallback((mantraId: number) => {
    setCancelledDownloads((prev) => {
      const next = new Set(prev);
      next.add(mantraId);
      return next;
    });
  }, []);

  const getDownloadStatus = useCallback(
    (mantraId: number): DownloadStatus => {
      if (activeDownloads.has(mantraId)) {
        return 'downloading';
      }
      if (downloadedMantras[mantraId]) {
        return 'downloaded';
      }
      return 'not_downloaded';
    },
    [activeDownloads, downloadedMantras]
  );

  const getDownloadProgress = useCallback(
    (mantraId: number): DownloadProgress | null => {
      return activeDownloads.get(mantraId) || null;
    },
    [activeDownloads]
  );

  const isMantraDownloaded = useCallback(
    (mantraId: number): boolean => {
      return !!downloadedMantras[mantraId];
    },
    [downloadedMantras]
  );

  const value: DownloadContextType = {
    downloadedMantras,
    activeDownloads,
    downloadMantra,
    deleteDownload,
    cancelDownload,
    getDownloadStatus,
    getDownloadProgress,
    isMantraDownloaded,
    refreshDownloadedMantras,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}
