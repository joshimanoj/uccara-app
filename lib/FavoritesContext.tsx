/**
 * FavoritesContext for Uccara app
 * Manages saved mantras for both guest and authenticated users
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Mantra } from './supabase';
import { useAuth } from './AuthContext';

const LOCAL_FAVORITES_KEY = '@uccara/local_favorites';

interface FavoritesContextType {
    favorites: number[]; // Array of mantra IDs
    isLoading: boolean;
    isFavorite: (mantraId: number) => boolean;
    toggleFavorite: (mantraId: number) => Promise<void>;
    migrateLocalFavorites: () => Promise<void>;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites on mount or user change
    useEffect(() => {
        refreshFavorites();
        if (user) {
            migrateLocalFavorites();
        }
    }, [user]);

    const refreshFavorites = useCallback(async () => {
        setIsLoading(true);
        try {
            if (user) {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('user_favorites')
                    .select('mantra_id')
                    .eq('user_id', user.id);

                if (error) throw error;
                setFavorites(data?.map(f => f.mantra_id) || []);
            } else {
                // Fetch from local storage
                const local = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
                setFavorites(local ? JSON.parse(local) : []);
            }
        } catch (error) {
            // Use console.log instead of console.error to avoid red overlay in dev mode
            // This error is expected when offline and is handled gracefully
            console.log('FavoritesContext: Could not refresh favorites (offline?):', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const isFavorite = useCallback((mantraId: number) => {
        return favorites.includes(mantraId);
    }, [favorites]);

    const toggleFavorite = useCallback(async (mantraId: number) => {
        const currentlyFavorite = isFavorite(mantraId);

        // Optimistic UI update
        const newFavorites = currentlyFavorite
            ? favorites.filter(id => id !== mantraId)
            : [...favorites, mantraId];

        setFavorites(newFavorites);

        try {
            if (user) {
                if (currentlyFavorite) {
                    await supabase
                        .from('user_favorites')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('mantra_id', mantraId);
                } else {
                    await supabase
                        .from('user_favorites')
                        .insert({ user_id: user.id, mantra_id: mantraId });
                }
            } else {
                // Guest user - update local storage
                await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(newFavorites));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert on error
            setFavorites(favorites);
        }
    }, [user, favorites, isFavorite]);

    const migrateLocalFavorites = useCallback(async () => {
        if (!user) return;

        try {
            const localStr = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
            if (!localStr) return;

            const localIds: number[] = JSON.parse(localStr);
            if (localIds.length === 0) return;

            console.log(`Migrating ${localIds.length} favorites for user ${user.id}`);

            // 1. Get existing favorites to avoid duplicates
            const { data: existing } = await supabase
                .from('user_favorites')
                .select('mantra_id')
                .eq('user_id', user.id);

            const existingIds = existing?.map(f => f.mantra_id) || [];
            const newIds = localIds.filter(id => !existingIds.includes(id));

            if (newIds.length > 0) {
                const inserts = newIds.map(id => ({
                    user_id: user.id,
                    mantra_id: id
                }));

                const { error } = await supabase
                    .from('user_favorites')
                    .insert(inserts);

                if (error) throw error;
            }

            // 2. Clear local storage after successful migration
            await AsyncStorage.removeItem(LOCAL_FAVORITES_KEY);

            // 3. Refresh the state
            await refreshFavorites();

        } catch (error) {
            console.error('Migration failed:', error);
        }
    }, [user, refreshFavorites]);

    const value = {
        favorites,
        isLoading,
        isFavorite,
        toggleFavorite,
        migrateLocalFavorites,
        refreshFavorites
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
