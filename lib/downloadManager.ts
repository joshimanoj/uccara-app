/**
 * Download Manager for Uccara app
 * Handles file download/storage utilities for offline audio playback
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_METADATA_KEY = '@uccara/downloads';

// Storage structure: ${documentDirectory}mantras/${mantra_id}/line_${line_id}.mp3
const MANTRAS_DIR = `${FileSystem.documentDirectory}mantras/`;

export interface DownloadedMantraMetadata {
  downloadedAt: number;
  lineCount: number;
  totalSize: number;
  mantraTitle?: string;
  mantraSlug?: string;
}

export interface DownloadedMantrasMap {
  [mantraId: number]: DownloadedMantraMetadata;
}

// Type for UI display
export interface DownloadedMantraInfo {
  mantraId: number;
  mantraTitle: string;
  mantraSlug: string;
  lineCount: number;
  totalSize: number;
  downloadedAt: number;
}

/**
 * Get the local file path for a mantra line audio
 */
export function getLocalAudioPath(mantraId: number, lineId: number): string {
  const path = `${MANTRAS_DIR}${mantraId}/line_${lineId}.mp3`;
  console.log(`getLocalAudioPath: Resolved path for ${mantraId}/line_${lineId} -> ${path}`);
  return path;
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Get file size if it exists
 */
async function getFileSize(path: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists && info.size ? info.size : 0;
  } catch {
    return 0;
  }
}

/**
 * Ensure the mantra directory exists
 */
async function ensureMantraDirectory(mantraId: number): Promise<void> {
  const mantraDir = `${MANTRAS_DIR}${mantraId}/`;
  const exists = await fileExists(mantraDir);
  if (!exists) {
    await FileSystem.makeDirectoryAsync(mantraDir, { intermediates: true });
  }
}

/**
 * Check if a specific audio line is downloaded
 */
export async function isAudioDownloaded(mantraId: number, lineId: number): Promise<boolean> {
  const path = getLocalAudioPath(mantraId, lineId);
  return fileExists(path);
}

/**
 * Check if entire mantra is downloaded (all lines)
 */
export async function isMantraFullyDownloaded(
  mantraId: number,
  lineIds: number[]
): Promise<boolean> {
  for (const lineId of lineIds) {
    const downloaded = await isAudioDownloaded(mantraId, lineId);
    if (!downloaded) {
      return false;
    }
  }
  return lineIds.length > 0;
}

/**
 * Download a single audio file
 */
export async function downloadAudio(
  url: string,
  mantraId: number,
  lineId: number,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('downloadAudio called with:', { url, mantraId, lineId });

  if (!url) {
    throw new Error('No URL provided for download');
  }

  await ensureMantraDirectory(mantraId);
  console.log('Directory ensured for mantra:', mantraId);

  const localPath = getLocalAudioPath(mantraId, lineId);
  console.log('Local path:', localPath);

  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localPath,
      {},
      (downloadProgress) => {
        if (downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress?.(progress);
        }
      }
    );

    console.log('Starting download from URL:', url);
    const result = await downloadResumable.downloadAsync();
    console.log('Download result:', JSON.stringify(result));

    if (!result) {
      throw new Error('Download returned null result');
    }

    if (!result.uri) {
      throw new Error(`Download failed with status: ${result.status}`);
    }

    // Verify the file was created
    const exists = await fileExists(localPath);
    if (!exists) {
      throw new Error('File was not created after download');
    }

    console.log('Download successful:', localPath);
    return result.uri;
  } catch (error: any) {
    console.error('downloadAudio error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw new Error(`Download failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Delete all downloaded audio for a specific mantra (alias for deleteMantraDownload)
 */
export async function deleteMantraAudio(mantraId: number): Promise<void> {
  // This is now an alias - deleteMantraDownload handles both files and metadata
  await deleteMantraDownload(mantraId);
}

/**
 * Get list of all downloaded mantras with their metadata
 */
export async function getDownloadedMantras(): Promise<DownloadedMantrasMap> {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_METADATA_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading download metadata:', error);
  }
  return {};
}

/**
 * Save download metadata for a mantra
 */
export async function saveDownloadMetadata(
  mantraId: number,
  lineCount: number,
  totalSize: number,
  mantraTitle?: string,
  mantraSlug?: string
): Promise<void> {
  const downloads = await getDownloadedMantras();
  downloads[mantraId] = {
    downloadedAt: Date.now(),
    lineCount,
    totalSize,
    mantraTitle,
    mantraSlug,
  };
  await AsyncStorage.setItem(DOWNLOADS_METADATA_KEY, JSON.stringify(downloads));
}

/**
 * Get downloaded mantras as an array for UI display
 */
export async function getDownloadedMantrasArray(): Promise<DownloadedMantraInfo[]> {
  const downloads = await getDownloadedMantras();
  return Object.entries(downloads).map(([id, meta]) => ({
    mantraId: parseInt(id),
    mantraTitle: meta.mantraTitle || `Mantra ${id}`,
    mantraSlug: meta.mantraSlug || `mantra-${id}`,
    lineCount: meta.lineCount,
    totalSize: meta.totalSize,
    downloadedAt: meta.downloadedAt,
  }));
}

/**
 * Delete a mantra download (files and metadata)
 */
export async function deleteMantraDownload(mantraId: number): Promise<void> {
  const mantraDir = `${MANTRAS_DIR}${mantraId}`;
  try {
    await FileSystem.deleteAsync(mantraDir, { idempotent: true });
  } catch (error) {
    console.log('Error deleting mantra files:', error);
  }
  // Remove metadata
  const downloads = await getDownloadedMantras();
  delete downloads[mantraId];
  await AsyncStorage.setItem(DOWNLOADS_METADATA_KEY, JSON.stringify(downloads));
}

/**
 * Get storage usage information
 */
export async function getStorageUsage(): Promise<{ used: number; available: number }> {
  try {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();

    // Calculate used space by downloaded mantras
    let usedSpace = 0;
    const mantrasExists = await fileExists(MANTRAS_DIR);

    if (mantrasExists) {
      const mantraDirs = await FileSystem.readDirectoryAsync(MANTRAS_DIR);

      for (const mantraDir of mantraDirs) {
        const mantraPath = `${MANTRAS_DIR}${mantraDir}/`;
        try {
          const files = await FileSystem.readDirectoryAsync(mantraPath);
          for (const file of files) {
            const size = await getFileSize(`${mantraPath}${file}`);
            usedSpace += size;
          }
        } catch {
          // Skip directories we can't read
        }
      }
    }

    return {
      used: usedSpace,
      available: freeSpace,
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, available: 0 };
  }
}

/**
 * Get the file size of a downloaded audio if it exists
 */
export async function getDownloadedFileSize(mantraId: number, lineId: number): Promise<number> {
  const path = getLocalAudioPath(mantraId, lineId);
  return getFileSize(path);
}

/**
 * Check if audio exists locally and return the path, otherwise return null
 */
export async function getLocalAudioIfExists(
  mantraId: number,
  lineId: number
): Promise<string | null> {
  const path = getLocalAudioPath(mantraId, lineId);
  const exists = await fileExists(path);
  // Debug log to verify path resolution
  if (!exists) {
    console.log(`getLocalAudioIfExists: File NOT found at ${path}`);
  } else {
    console.log(`getLocalAudioIfExists: File found at ${path}`);
  }
  return exists ? path : null;
}
/**
 * Clear all downloaded audio files and metadata
 */
export async function clearAllDownloads(): Promise<void> {
  try {
    const exists = await fileExists(MANTRAS_DIR);
    if (exists) {
      await FileSystem.deleteAsync(MANTRAS_DIR, { idempotent: true });
      console.log('clearAllDownloads: Deleted audio files directory');
    }
  } catch (error) {
    console.error('clearAllDownloads: Error deleting files:', error);
  }

  try {
    await AsyncStorage.removeItem(DOWNLOADS_METADATA_KEY);
    console.log('clearAllDownloads: Removed metadata from AsyncStorage');
  } catch (error) {
    console.error('clearAllDownloads: Error removing metadata:', error);
  }
}
