/**
 * Downloads Screen for Uccara app
 * Shows downloaded mantras for offline use
 */

import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme/ThemeContext';
import { useDownload } from '../../lib/DownloadContext';
import { getDownloadedMantrasArray, DownloadedMantraInfo } from '../../lib/downloadManager';
import {
    ChevronLeftIcon,
    TrashIcon,
    DownloadIcon,
    CheckCircleIcon,
} from '../../components/Icons';

export default function DownloadsScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const { deleteDownload } = useDownload();
    const [downloads, setDownloads] = useState<DownloadedMantraInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    const loadDownloads = async () => {
        try {
            const data = await getDownloadedMantrasArray();
            setDownloads(data);
        } catch (error) {
            console.log('Error loading downloads:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDownloads();
        }, [])
    );

    const handleDelete = (mantraId: number, title: string) => {
        Alert.alert(
            'Delete Download',
            `Are you sure you want to delete "${title}"? You can download it again later.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(mantraId);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        try {
                            await deleteDownload(mantraId);
                            setDownloads((prev) => prev.filter((d) => d.mantraId !== mantraId));
                        } catch (error) {
                            console.log('Error deleting download:', error);
                            Alert.alert('Error', 'Failed to delete download');
                        } finally {
                            setDeleting(null);
                        }
                    },
                },
            ]
        );
    };

    const handleMantraPress = (slug: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/mantra/${slug}`);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalSize = downloads.reduce((sum, d) => sum + (d.totalSize || 0), 0);

    const styles = createStyles(theme, insets);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                >
                    <ChevronLeftIcon size={24} color={theme.colors.text.primary} />
                </Pressable>
                <Text style={styles.title}>Downloads</Text>
                <View style={styles.placeholder} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent.primary} />
                </View>
            ) : downloads.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <DownloadIcon size={64} color={theme.colors.text.muted} />
                    <Text style={styles.emptyTitle}>No Downloads</Text>
                    <Text style={styles.emptyText}>
                        Download mantras to listen offline without internet
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Downloaded Mantras</Text>
                            <Text style={styles.summaryValue}>{downloads.length}</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Size</Text>
                            <Text style={styles.summaryValue}>{formatSize(totalSize)}</Text>
                        </View>
                    </View>

                    {/* Downloads List */}
                    <View style={styles.listCard}>
                        {downloads.map((download, index) => (
                            <View key={download.mantraId}>
                                {index > 0 && <View style={styles.divider} />}
                                <Pressable
                                    style={styles.downloadItem}
                                    onPress={() => handleMantraPress(download.mantraSlug)}
                                >
                                    <View style={styles.downloadInfo}>
                                        <View style={styles.downloadIcon}>
                                            <CheckCircleIcon size={20} color={theme.colors.status.success} />
                                        </View>
                                        <View style={styles.downloadText}>
                                            <Text style={styles.downloadTitle} numberOfLines={1}>
                                                {download.mantraTitle}
                                            </Text>
                                            <Text style={styles.downloadMeta}>
                                                {download.lineCount} lines • {formatSize(download.totalSize || 0)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Pressable
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(download.mantraId, download.mantraTitle)}
                                        disabled={deleting === download.mantraId}
                                    >
                                        {deleting === download.mantraId ? (
                                            <ActivityIndicator size="small" color={theme.colors.status.error} />
                                        ) : (
                                            <TrashIcon size={20} color={theme.colors.status.error} />
                                        )}
                                    </Pressable>
                                </Pressable>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const createStyles = (theme: any, insets: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.page,
            paddingTop: insets.top,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        backButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.background.elevated,
            justifyContent: 'center',
            alignItems: 'center',
        },
        title: {
            fontFamily: theme.fontFamilies.primary.semiBold,
            fontWeight: '600',
            fontSize: 18,
            color: theme.colors.text.primary,
        },
        placeholder: {
            width: 40,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
        },
        emptyTitle: {
            fontFamily: theme.fontFamilies.primary.semiBold,
            fontWeight: '600',
            fontSize: 20,
            color: theme.colors.text.primary,
            marginTop: 20,
            marginBottom: 8,
        },
        emptyText: {
            fontFamily: theme.fontFamilies.primary.regular,
            fontSize: 15,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: 22,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            padding: 20,
            paddingBottom: 40,
        },
        summaryCard: {
            backgroundColor: theme.colors.background.cardSolid,
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            ...theme.shadows.sm,
        },
        summaryRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        summaryLabel: {
            fontFamily: theme.fontFamilies.primary.medium,
            fontSize: 15,
            color: theme.colors.text.secondary,
        },
        summaryValue: {
            fontFamily: theme.fontFamilies.primary.semiBold,
            fontWeight: '600',
            fontSize: 15,
            color: theme.colors.text.primary,
        },
        summaryDivider: {
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.ui.divider,
            marginVertical: 12,
        },
        listCard: {
            backgroundColor: theme.colors.background.cardSolid,
            borderRadius: 16,
            overflow: 'hidden',
            ...theme.shadows.sm,
        },
        downloadItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
        },
        downloadInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        downloadIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: `${theme.colors.status.success}15`,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        downloadText: {
            flex: 1,
        },
        downloadTitle: {
            fontFamily: theme.fontFamilies.primary.medium,
            fontSize: 16,
            color: theme.colors.text.primary,
            marginBottom: 2,
        },
        downloadMeta: {
            fontFamily: theme.fontFamilies.primary.regular,
            fontSize: 13,
            color: theme.colors.text.secondary,
        },
        deleteButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 12,
        },
        divider: {
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.ui.divider,
            marginHorizontal: 16,
        },
    });
