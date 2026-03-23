import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { favoritesApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Avatar } from '../src/components/Avatar';
import { spacing, typography, radius } from '../src/theme';

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    try {
      const res = await favoritesApi.getFavorites();
      setFavorites(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, []);

  const removeFavorite = async (id: string) => {
    try {
      await favoritesApi.removeFavorite(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Mes favoris" />

      <FlatList
        data={isLoading ? [] : favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/freelancer/${item.id}`)}
            activeOpacity={0.8}
          >
            <Avatar uri={item.avatar} name={item.full_name} size={48} borderRadius={radius.lg} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: theme.title }]}>{item.full_name}</Text>
              {item.city && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>{item.city}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => removeFavorite(item.id)} style={styles.removeBtn}>
              <Ionicons name="heart" size={22} color={theme.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Aucun favori</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Ajoutez des créatifs à vos favoris</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.lg, borderRadius: radius.xl, marginBottom: spacing.sm, gap: spacing.md,
  },
  removeBtn: { padding: spacing.sm },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
});
