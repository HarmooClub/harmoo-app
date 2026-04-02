import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { portfolioApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { spacing, typography, radius } from '../src/theme';

export default function MyPortfolioScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadPortfolio(); }, []);

  const loadPortfolio = async () => {
    try {
      const res = await portfolioApi.getMyPortfolio();
      setItems(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPortfolio();
    setRefreshing(false);
  }, []);

  const handleDelete = (id: string) => {
    const doDelete = async () => {
      try {
        await portfolioApi.deletePortfolioItem(id);
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (e) { Alert.alert('Erreur', 'Impossible de supprimer'); }
    };
    if (Platform.OS === 'web') { if (window.confirm('Supprimer ?')) doDelete(); }
    else { Alert.alert('Supprimer', 'Supprimer ce projet ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: doDelete }]); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader
        title="Mon portfolio"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/add-portfolio')} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={isLoading ? [] : items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.gridItem, { backgroundColor: theme.card }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImagePlaceholder, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="image" size={24} color={theme.primary} />
              </View>
            )}
            <View style={styles.itemContent}>
              <Text style={[typography.labelMedium, { color: theme.title }]} numberOfLines={1}>{item.title}</Text>
              {item.completion_date && (
                <Text style={[typography.tiny, { color: theme.textSecondary, marginTop: 2 }]}>{item.completion_date}</Text>
              )}
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity style={styles.itemEdit} onPress={() => router.push({ pathname: '/add-portfolio', params: { editId: item.id, editData: JSON.stringify(item) } })}>
                <Ionicons name="create" size={14} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.itemDelete} onPress={() => handleDelete(item.id)}>
                <Ionicons name="close" size={14} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Portfolio vide</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Ajoutez votre premier projet</Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/add-portfolio')}>
                <Text style={[typography.labelLarge, { color: '#FFF' }]}>Ajouter un projet</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  grid: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  gridItem: { flex: 1, borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  itemImage: { width: '100%', height: 130, resizeMode: 'cover' },
  itemImagePlaceholder: { width: '100%', height: 130, alignItems: 'center', justifyContent: 'center' },
  itemContent: { padding: spacing.md },
  itemDelete: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  itemActions: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    flexDirection: 'row', gap: 6,
  },
  itemEdit: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  createBtn: { marginTop: spacing.xl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.lg },
});
