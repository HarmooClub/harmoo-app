import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator, Image, Dimensions, ImageBackground, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useLocation } from '../../src/hooks/useLocation';
import { freelancersApi, favoritesApi } from '../../src/services/api';
import { getAvatarUrl } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { getCategoryName, getFirstSubcategoryLabel } from '../../src/utils/categories';
import { spacing, typography, radius, shadows, palette } from '../../src/theme';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 10;
const HORIZONTAL_PAD = 16;
const COLUMN_WIDTH = (width - HORIZONTAL_PAD * 2 - COLUMN_GAP) / 2;

const CATEGORIES = [
  { id: 'all', name: 'Tous' },
  { id: 'ia', name: 'IA' },
  { id: 'music', name: 'Musique' },
  { id: 'video', name: 'Audiovisuel' },
  { id: 'photo', name: 'Photo' },
  { id: 'design', name: 'Arts graphiques' },
  { id: 'fashion', name: 'Mode' },
  { id: 'event', name: 'Événementiel' },
  { id: 'architecture', name: 'Architecture' },
  { id: 'writing', name: 'Rédaction' },
  { id: 'content', name: 'Contenu' },
  { id: 'artisanal', name: 'Artisanat' },
  { id: 'spectacle_vivant', name: 'Spectacle vivant' },
];

const PAGE_SIZE = 20;

// Larger card heights for better visual presence
const CARD_HEIGHTS = [260, 290, 320, 280, 300, 270, 310, 295, 275, 305];

// Default placeholder colors for users without avatar
const PLACEHOLDER_COLORS = ['#DC1B78', '#1DB7F8', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];

function getPlaceholderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

export default function DiscoverScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { location, requestPermission } = useLocation();
  const router = useRouter();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Auth popup logic
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const actionCountRef = useRef(0);
  const popupShownRef = useRef(false);

  const triggerAuthPopup = useCallback(() => {
    if (!user && !popupShownRef.current) {
      popupShownRef.current = true;
      setShowAuthPopup(true);
    }
  }, [user]);

  const trackAction = useCallback(() => {
    if (user || popupShownRef.current) return;
    actionCountRef.current += 1;
    if (actionCountRef.current >= 3) {
      triggerAuthPopup();
    }
  }, [user, triggerAuthPopup]);

  // Timer: 15s after mount, trigger popup regardless
  useEffect(() => {
    if (user) return;
    const timer = setTimeout(() => {
      triggerAuthPopup();
    }, 15000);
    return () => clearTimeout(timer);
  }, [user, triggerAuthPopup]);

  useEffect(() => { requestPermission(); }, []);
  useEffect(() => { loadInitialData(); }, [selectedCategory, location]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setPage(0);
    setHasMore(true);
    try {
      const params: any = { limit: PAGE_SIZE, skip: 0 };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      // Exclude own profile from feed
      if (user?.id) params.exclude_user_id = user.id;
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.max_distance_minutes = 60;
      }
      const [freelancersRes, favoritesRes] = await Promise.all([
        freelancersApi.getFreelancers(params),
        user ? favoritesApi.getFavorites().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);
      setFreelancers(freelancersRes.data);
      setFavorites(favoritesRes.data.map((f: any) => f.id));
      setHasMore(freelancersRes.data.length >= PAGE_SIZE);
      setPage(1);
    } catch (error) {
      console.error('Failed to load data:', error);
      setFreelancers([]);
    } finally { setIsLoading(false); }
  };

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    try {
      const params: any = { limit: PAGE_SIZE, skip: page * PAGE_SIZE };
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (user?.id) params.exclude_user_id = user.id;
      if (location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.max_distance_minutes = 60;
      }
      const res = await freelancersApi.getFreelancers(params);
      if (res.data.length > 0) {
        setFreelancers(prev => [...prev, ...res.data]);
        setPage(prev => prev + 1);
      }
      setHasMore(res.data.length >= PAGE_SIZE);
    } catch (error) { console.error(error); }
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
    } catch (error) { console.error(error); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [selectedCategory, location]);

  // Split into 2 columns for masonry
  const leftColumn: any[] = [];
  const rightColumn: any[] = [];
  let leftHeight = 0;
  let rightHeight = 0;

  freelancers.forEach((item, index) => {
    const cardHeight = CARD_HEIGHTS[index % CARD_HEIGHTS.length];
    if (leftHeight <= rightHeight) {
      leftColumn.push({ ...item, _cardHeight: cardHeight });
      leftHeight += cardHeight;
    } else {
      rightColumn.push({ ...item, _cardHeight: cardHeight });
      rightHeight += cardHeight;
    }
  });

  const getCategoryLabel = () => {
    if (selectedCategory === 'all') return location ? 'Près de chez vous' : 'Artistes-Entrepreneurs';
    return CATEGORIES.find(c => c.id === selectedCategory)?.name || '';
  };

  const renderMasonryCard = (item: any, index: number) => {
    const isFav = favorites.includes(item.id);
    const avatarUrl = getAvatarUrl(item.avatar, item.full_name);
    const cardH = item._cardHeight;
    const profession = getFirstSubcategoryLabel(item.subcategories);
    const categoryName = item.categories?.[0] ? getCategoryName(item.categories[0]) : null;
    const hasImage = !!avatarUrl;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.masonryCard, { height: cardH }, shadows.sm]}
        onPress={() => { trackAction(); router.push(`/freelancer/${item.id}`); }}
        activeOpacity={0.85}
      >
        {/* Full card background image or placeholder */}
        {hasImage ? (
          <Image
            source={{ uri: avatarUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: getPlaceholderColor(item.full_name) + '25' }]}>
            <View style={styles.placeholderCenter}>
              <Text style={[styles.placeholderInitials, { color: getPlaceholderColor(item.full_name) }]}>
                {item.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          </View>
        )}

        {/* Fav button */}
        <TouchableOpacity
          style={styles.cardFavBtn}
          onPress={(e) => { e.stopPropagation?.(); toggleFavorite(item.id); }}
        >
          <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={16} color={isFav ? '#FF4D6D' : '#FFF'} />
        </TouchableOpacity>

        {/* Club badge */}
        {item.is_harmoo_club && (
          <View style={styles.cardClubBadge}>
            <Badge label="Club" variant="club" />
          </View>
        )}

        {/* Gradient overlay at bottom with info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.6]}
          style={styles.cardOverlay}
        >
          <Text style={styles.cardName} numberOfLines={1}>{item.full_name}</Text>
          {profession && (
            <Text style={styles.cardProfession} numberOfLines={1}>{profession}</Text>
          )}
          {categoryName && (
            <Text style={styles.cardCategory} numberOfLines={1}>{categoryName}</Text>
          )}
          <View style={styles.cardMeta}>
            {item.city && (
              <View style={styles.cardMetaItem}>
                <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cardMetaText} numberOfLines={1}>{item.city}</Text>
              </View>
            )}
            {item.hourly_rate != null && (
              <Text style={styles.cardPrice}>Dès {item.hourly_rate}€</Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Auth banner for non-authenticated users */}
      {!user && (
        <TouchableOpacity
          style={[styles.authBanner, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/(auth)/welcome')}
          activeOpacity={0.85}
        >
          <Text style={styles.authBannerText}>Rejoins Harmoo</Text>
          <View style={styles.authBannerButtons}>
            <TouchableOpacity
              style={styles.authBannerBtn}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.authBannerBtnText}>S'inscrire</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authBannerBtn, styles.authBannerBtnOutline]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.authBannerBtnText, { color: '#fff' }]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Greeting with location */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity 
            style={styles.locationLabel}
            onPress={requestPermission}
          >
            <Ionicons 
              name={location ? 'location' : 'location-outline'} 
              size={16} 
              color={location ? theme.primary : theme.textSecondary} 
            />
            <Text style={[typography.bodySmall, { color: location ? theme.primary : theme.textSecondary, marginLeft: 4 }]}>
              {location ? 'Près de chez vous' : 'Activer la localisation'}
            </Text>
          </TouchableOpacity>
          <Text style={[typography.h1, { color: theme.title, marginTop: spacing.xs }]}>
            Bonjour{user ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: location ? theme.primarySoft : theme.card, borderColor: location ? theme.primary + '40' : theme.border }]}
          onPress={requestPermission}
        >
          <Ionicons name={location ? 'navigate' : 'navigate-outline'} size={20} color={location ? theme.primary : theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Categories — text only, NO icons */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item: cat }) => (
          <TouchableOpacity
            style={[styles.categoryChip, {
              backgroundColor: selectedCategory === cat.id ? theme.primary : theme.card,
              borderColor: selectedCategory === cat.id ? theme.primary : theme.border,
            }]}
            onPress={() => { trackAction(); setSelectedCategory(cat.id); }}
          >
            <Text style={[typography.labelMedium, { color: selectedCategory === cat.id ? '#FFF' : theme.text }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={[typography.h2, { color: theme.title }]}>{getCategoryLabel()}</Text>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>
          {freelancers.length} résultat{freelancers.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }
    const categoryName = selectedCategory === 'all' ? '' : CATEGORIES.find(c => c.id === selectedCategory)?.name || '';
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={56} color={theme.textSecondary} />
        <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Il n'y a rien ici</Text>
        <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.xxxl }]}>
          {categoryName
            ? `Aucun créatif trouvé dans la catégorie "${categoryName}"`
            : location ? 'Aucun créatif trouvé près de chez vous' : 'Aucun créatif disponible pour le moment'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={[{ key: 'masonry' }]}
        keyExtractor={() => 'masonry'}
        ListHeaderComponent={renderHeader}
        renderItem={() => {
          if (isLoading) return renderEmpty();
          if (freelancers.length === 0) return renderEmpty();

          return (
            <View style={styles.masonryContainer}>
              <View style={styles.masonryColumn}>
                {leftColumn.map((item, i) => renderMasonryCard(item, i))}
              </View>
              <View style={styles.masonryColumn}>
                {rightColumn.map((item, i) => renderMasonryCard(item, i))}
              </View>
            </View>
          );
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />

      {/* Auth Popup Overlay */}
      {showAuthPopup && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowAuthPopup(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.card }]} onPress={() => {}}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowAuthPopup(false)}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>

            <Ionicons name="sparkles" size={40} color={theme.primary} style={{ marginBottom: 12 }} />
            <Text style={[typography.h1, { color: theme.title, textAlign: 'center' }]}>
              Rejoins la communauté
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.text, textAlign: 'center', marginTop: 8, marginBottom: 24 }]}>
              Crée ton compte pour contacter les créatifs et réserver des prestations
            </Text>

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { backgroundColor: theme.primary }]}
              onPress={() => { setShowAuthPopup(false); router.push('/(auth)/register'); }}
            >
              <Text style={styles.modalPrimaryBtnText}>Créer un compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSecondaryBtn, { borderColor: theme.border }]}
              onPress={() => { setShowAuthPopup(false); router.push('/(auth)/login'); }}
            >
              <Text style={[styles.modalSecondaryBtnText, { color: theme.title }]}>Se connecter</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  locationButton: {
    width: 44, height: 44, borderRadius: radius.lg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  categoriesContainer: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PAD,
    marginBottom: spacing.md,
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: HORIZONTAL_PAD,
    gap: COLUMN_GAP,
  },
  masonryColumn: {
    flex: 1,
    gap: COLUMN_GAP,
  },
  masonryCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1A1A24',
  },
  placeholderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitials: {
    fontSize: 40,
    fontWeight: '800',
    opacity: 0.6,
  },
  cardFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardClubBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  // Gradient overlay at the bottom of the card
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 12,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cardProfession: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    letterSpacing: 0.3,
    textTransform: 'uppercase' as const,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  cardMetaText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  cardPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  locationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Auth banner
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: HORIZONTAL_PAD,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  authBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  authBannerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  authBannerBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  authBannerBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  authBannerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC1B78',
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSecondaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  modalSecondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
