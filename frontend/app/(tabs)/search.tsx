import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { freelancersApi, favoritesApi } from '../../src/services/api';
import { useAuth } from '../../src/contexts/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { Card } from '../../src/components/Card';
import { getCategoryName, CATEGORY_SUBCATEGORIES, CATEGORY_NAMES } from '../../src/utils/categories';
import { spacing, typography, radius } from '../../src/theme';

const CATEGORY_JOB_TYPES: Record<string, { name: string; jobs: string[] }> = {};
// Build from shared categories data
Object.keys(CATEGORY_NAMES).forEach((catId) => {
  CATEGORY_JOB_TYPES[catId] = {
    name: CATEGORY_NAMES[catId],
    jobs: (CATEGORY_SUBCATEGORIES[catId] || []).map(
      (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    ),
  };
});

export default function SearchScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const res = await favoritesApi.getFavorites();
      setFavorites(res.data.map((f: any) => f.id));
    } catch (e) {}
  };

  const search = async (query?: string, category?: string) => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const params: any = { limit: 50 };
      if (query || searchQuery) params.search = query || searchQuery;
      if (category || selectedCategory) params.category = category || selectedCategory;
      const res = await freelancersApi.getFreelancers(params);
      setResults(res.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally { setIsLoading(false); }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategory(expandedCategory === catId ? null : catId);
  };

  const selectJob = (catId: string, job: string) => {
    setSelectedCategory(catId);
    setSelectedJob(job);
    setSearchQuery(job);
    setExpandedCategory(null);
    search(job, catId);
  };

  const selectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedJob(null);
    setSearchQuery('');
    search('', catId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedJob(null);
    setExpandedCategory(null);
    setResults([]);
    setHasSearched(false);
  };

  const toggleFavorite = async (freelancerId: string) => {
    if (!user) return;
    try {
      if (favorites.includes(freelancerId)) {
        await favoritesApi.removeFavorite(freelancerId);
        setFavorites(prev => prev.filter(id => id !== freelancerId));
      } else {
        await favoritesApi.addFavorite(freelancerId);
        setFavorites(prev => [...prev, freelancerId]);
      }
    } catch (e) {}
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (hasSearched) await search();
    setRefreshing(false);
  }, [hasSearched, searchQuery, selectedCategory]);

  const renderCategoryDropdown = ({ item }: { item: [string, typeof CATEGORY_JOB_TYPES['music']] }) => {
    const [catId, cat] = item;
    const isExpanded = expandedCategory === catId;
    const isSelected = selectedCategory === catId;

    return (
      <Card style={[styles.categoryDropdown, isSelected && { borderColor: theme.primary + '40', borderWidth: 1 }]}>
        <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(catId)} activeOpacity={0.7}>
          <View style={styles.categoryLeft}>
            <Text style={[typography.h4, { color: isSelected ? theme.primary : theme.title }]}>{cat.name}</Text>
            <Text style={[typography.tiny, { color: theme.textSecondary }]}>{cat.jobs.length} métiers</Text>
          </View>
          <View style={styles.categoryRight}>
            {!isExpanded && (
              <TouchableOpacity style={[styles.searchCatBtn, { backgroundColor: theme.primarySoft }]} onPress={() => selectCategory(catId)}>
                <Ionicons name="search" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.jobsList, { borderTopColor: theme.divider }]}>
            {cat.jobs.map((job, index) => (
              <TouchableOpacity
                key={job}
                style={[
                  styles.jobItem,
                  selectedJob === job && { backgroundColor: theme.primarySoft },
                  index < cat.jobs.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.divider },
                ]}
                onPress={() => selectJob(catId, job)}
              >
                <Text style={[typography.bodySmall, { color: selectedJob === job ? theme.primary : theme.title }]}>{job}</Text>
                <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    );
  };

  const renderResultCard = ({ item }: { item: any }) => {
    const isFav = favorites.includes(item.id);
    return (
      <TouchableOpacity style={[styles.resultCard, { backgroundColor: theme.card }]} onPress={() => router.push(`/freelancer/${item.id}`)} activeOpacity={0.8}>
        <Avatar uri={item.avatar} name={item.full_name} size={48} borderRadius={radius.lg} />
        <View style={styles.resultInfo}>
          <Text style={[typography.h4, { color: theme.title }]} numberOfLines={1}>{item.full_name}</Text>
          {item.city && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{item.city}</Text>
            </View>
          )}
          <View style={styles.resultMeta}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={[typography.captionBold, { color: theme.title }]}>{item.rating?.toFixed(1) || '0.0'}</Text>
            </View>
            {item.hourly_rate ? <Text style={[typography.labelMedium, { color: theme.primary }]}>{item.hourly_rate}€/h</Text> : null}
          </View>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.resultFav}>
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? theme.primary : theme.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const showResults = hasSearched && !isLoading;
  const showCategories = !hasSearched;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.title }]}>Recherche</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.title }]}
          placeholder="Rechercher un métier, un nom..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => search()}
          returnKeyType="search"
        />
        {(searchQuery || selectedCategory) && (
          <TouchableOpacity onPress={clearFilters}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {selectedJob && (
        <View style={styles.activeFilterRow}>
          <View style={[styles.activeFilter, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '30' }]}>
            <Text style={[typography.labelMedium, { color: theme.primary }]}>{selectedJob}</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Ionicons name="close" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showCategories && (
        <FlatList
          data={Object.entries(CATEGORY_JOB_TYPES)}
          keyExtractor={([id]) => id}
          renderItem={renderCategoryDropdown}
          contentContainerStyle={styles.categoriesList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.md }]}>Explorer par catégorie</Text>
          }
        />
      )}

      {isLoading && (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
      )}

      {showResults && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderResultCard}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListHeaderComponent={
            <Text style={[typography.caption, { color: theme.textSecondary, marginBottom: spacing.md }]}>
              {results.length} résultat{results.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Aucun résultat</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Essayez d'autres termes</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.xl, marginBottom: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, gap: 10,
  },
  searchInput: { flex: 1, ...typography.bodyMedium },
  activeFilterRow: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  activeFilter: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, gap: spacing.sm, borderWidth: 1,
  },
  categoriesList: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  categoryDropdown: { marginBottom: spacing.sm },
  categoryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  searchCatBtn: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  jobsList: { borderTopWidth: 1 },
  jobItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingLeft: spacing.xxl,
  },
  resultsList: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  resultCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm, gap: spacing.md,
  },
  resultInfo: { flex: 1 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  resultFav: { padding: spacing.sm },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
});
