import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Mantra, Line, Term, MantraWithDetails, DeityMapping } from './supabase';

const MANTRAS_LIST_KEY = '@uccara/mantras_list_v4';
const MANTRA_DETAIL_PREFIX = '@uccara/mantra_detail_';
const DEITY_MAPPING_KEY = '@uccara/deity_mappings_v1';
// Cache check: forced update 2
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (metadata only) - maybe longer for text?

export interface MantraRepository {
    getAllMantras: () => Promise<Mantra[]>;
    getMantraBySlug: (slug: string) => Promise<MantraWithDetails | null>;
    syncAllMantras: () => Promise<void>;
    syncMantraDetail: (slug: string) => Promise<MantraWithDetails | null>;
    getMantrasByIds: (ids: number[]) => Promise<Mantra[]>;
    getDeityMappings: () => Promise<DeityMapping[]>;
    clearAllCache: () => Promise<void>;
}

/**
 * MantraRepository implementation using AsyncStorage for caching
 * Renamed to DataRepository to force cache invalidation
 */
export const mantraRepository: MantraRepository = {
    /**
     * Get all mantras (list view)
     * Stale-while-revalidate strategy: return cached first, then update
     */
    getAllMantras: async () => {
        try {
            console.log('getAllMantras: Checking cache...');
            // 1. Try cache
            const cached = await AsyncStorage.getItem(MANTRAS_LIST_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                console.log(`getAllMantras: Cache HIT (${parsed.length} items)`);
                return parsed;
            }

            console.log('getAllMantras: Cache MISS, fetching from Supabase...');
            // 2. Fetch network if no cache
            const { data, error } = await supabase
                .from('mantras')
                .select(`
          id,
          slug,
          title_primary,
          deity,
          intro_lines_devanagari,
          benefits_traditional
        `)
                .eq('show_on_ui', 1);

            if (error) {
                console.log('getAllMantras: Supabase error:', error);
                throw error;
            }

            if (data && data.length > 0) {
                console.log('DEBUG: Mantra columns:', Object.keys(data[0]));
            }
            if (data) {
                console.log(`getAllMantras: Fetch success (${data.length} items). Saving to cache.`);
                await AsyncStorage.setItem(MANTRAS_LIST_KEY, JSON.stringify(data));
                return data;
            }
            console.log('getAllMantras: No data returned from Supabase');
            return [];
        } catch (error: any) {
            console.log('getAllMantras: Request failed, attempting cache fallback:', error.message || error);
            // Fallback to cache even if stale/error
            const cached = await AsyncStorage.getItem(MANTRAS_LIST_KEY);
            return cached ? JSON.parse(cached) : [];
        }
    },

    /**
     * Get full mantra details by slug
     * Cache-first strategy
     */
    getMantraBySlug: async (slug: string) => {
        try {
            const key = `${MANTRA_DETAIL_PREFIX}${slug}`;
            const cached = await AsyncStorage.getItem(key);

            if (cached) {
                return JSON.parse(cached);
            }

            // If not in cache, fetch and store
            return await mantraRepository.syncMantraDetail(slug);
        } catch (error: any) {
            console.log(`Error getMantraBySlug(${slug}):`, error.message || error);
            return null;
        }
    },

    /**
     * Sync a specific mantra's details from network to cache
     */
    syncMantraDetail: async (slug: string) => {
        try {
            // Fetch Mantra
            const { data: mantraData, error: mantraError } = await supabase
                .from('mantras')
                .select('*')
                .eq('slug', slug)
                .single();

            if (mantraError) throw mantraError;

            // Fetch Lines
            const { data: linesData, error: linesError } = await supabase
                .from('lines')
                .select(`
          *,
          terms (
            *,
            words (*)
          )
        `)
                .eq('mantra_id', mantraData.id)
                .order('line_number');

            if (linesError) throw linesError;

            // Process and Sort
            const sortedLines = (linesData as any[])?.map((line: any) => ({
                ...line,
                terms: (line.terms || [])
                    .sort((a: any, b: any) => a.term_number - b.term_number)
                    .map((term: any) => ({
                        ...term,
                        words: (term.words || []).sort(
                            (a: any, b: any) => a.word_number - b.word_number
                        ),
                    })),
            }));

            const fullMantra: MantraWithDetails = { ...mantraData, lines: sortedLines };

            // Save to cache
            const key = `${MANTRA_DETAIL_PREFIX}${slug}`;
            await AsyncStorage.setItem(key, JSON.stringify(fullMantra));

            return fullMantra;
        } catch (error: any) {
            console.log(`Error syncing mantra detail (${slug}):`, error.message || error);
            return null;
        }
    },

    /**
     * Background sync of ALL mantras (for total offline capability)
     * This should be called on app start if connectivity exists
     */
    /**
     * Smart Delta Sync of mantras
     * Only fetches details if the mantra is new or updated
     */
    syncAllMantras: async () => {
        console.log('Starting Smart Delta Sync...');
        try {
            // 1. Fetch Manifest (Lightweight)
            // We ask for updated_at to compare versions
            console.log('syncAllMantras: Fetching manifest...');
            const { data: serverManifest, error: listError } = await supabase
                .from('mantras')
                .select(`
                    id,
                    slug,
                    title_primary,
                    deity,
                    intro_lines_devanagari,
                    benefits_traditional,
                    updated_at,
                    show_on_ui
                `)
                .eq('show_on_ui', 1);

            if (listError) throw listError;

            if (serverManifest) {
                console.log(`syncAllMantras: Manifest fetched (${serverManifest.length} items).`);

                // Get local cache to compare
                const localCacheStr = await AsyncStorage.getItem(MANTRAS_LIST_KEY);
                const localCache = localCacheStr ? JSON.parse(localCacheStr) : [];

                // Construct map for faster lookup: slug -> updated_at
                const localMap = new Map(localCache.map((m: any) => [m.slug, m.updated_at]));

                // Update List Cache immediately (so UI has new titles/order)
                await AsyncStorage.setItem(MANTRAS_LIST_KEY, JSON.stringify(serverManifest));

                // 2. Identify Stale/New Items
                const mantrasToUpdate = serverManifest.filter((serverMantra: any) => {
                    const localTime = localMap.get(serverMantra.slug);

                    // Case A: New Mantra (not in local map)
                    if (!localTime) return true;

                    // Case B: Updated Mantra (server time > local time)
                    // Note: If serverMantra.updated_at is null (legacy data), we might want to sync once. 
                    // Assuming triggers are active, updated_at will exist for changes.
                    if (serverMantra.updated_at && serverMantra.updated_at !== localTime) {
                        return true;
                    }

                    return false;
                });

                if (mantrasToUpdate.length === 0) {
                    console.log('syncAllMantras: Everything is up to date. No downloads needed.');
                    return;
                }

                console.log(`syncAllMantras: Found ${mantrasToUpdate.length} updates needed.`);

                // 3. Sync Details for ONLY changed mantras
                // Process sequentially or in small batches to be nice to the network
                for (const mantra of mantrasToUpdate) {
                    console.log(`Updating stale mantra: ${mantra.title_primary} (${mantra.slug})`);
                    await mantraRepository.syncMantraDetail(mantra.slug);
                }

                console.log('Smart Delta Sync completed successfully.');
            }
        } catch (error: any) {
            console.log('SafeSync: Error (offline?):', error.message || error);
        }
    },

    /**
     * Get multiple mantras by IDs from cache (with network fallback)
     */
    getMantrasByIds: async (ids: number[]) => {
        if (!ids || ids.length === 0) return [];
        try {
            // First try list cache
            const list = await mantraRepository.getAllMantras();
            const results = list.filter(m => ids.includes(m.id));

            if (results.length === ids.length) {
                return results;
            }

            // If some missing, we might need a network fetch, but for offline
            // we return whatever we have in the list cache.
            return results;
        } catch (error) {
            console.error('getMantrasByIds error:', error);
            return [];
        }
    },

    /**
     * Get deity name mappings (synonyms to primary)
     * Checks cache first
     */
    getDeityMappings: async () => {
        try {
            // 1. Try cache
            const cached = await AsyncStorage.getItem(DEITY_MAPPING_KEY);
            if (cached) {
                return JSON.parse(cached);
            }

            // 2. Fetch network
            const { data, error } = await supabase
                .from('deity_names')
                .select('*');

            if (error) {
                // If table doesn't exist yet, we can return empty or throw
                console.log('getDeityMappings: Supabase error (table/data missing?):', error.message);
                return [];
            }

            if (data) {
                await AsyncStorage.setItem(DEITY_MAPPING_KEY, JSON.stringify(data));
                return data;
            }
            return [];
        } catch (error) {
            console.error('getDeityMappings error:', error);
            return [];
        }
    },

    /**
     * Clear all cached mantra data
     */
    clearAllCache: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const uccaraKeys = keys.filter(key =>
                key.startsWith('@uccara/mantras_list') ||
                key.startsWith('@uccara/mantra_detail_')
            );

            if (uccaraKeys.length > 0) {
                await AsyncStorage.multiRemove(uccaraKeys);
                console.log(`clearAllCache: Removed ${uccaraKeys.length} keys`);
            }
        } catch (error) {
            console.error('clearAllCache error:', error);
        }
    }
};
