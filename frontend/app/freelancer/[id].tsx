import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions, Animated, TextInput, Modal, Platform, Share, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { freelancersApi, favoritesApi, messagesApi, reviewsApi } from '../../src/services/api';
import { Avatar, getAvatarUrl } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { getCategoryName, getFirstSubcategoryLabel, formatDateFR, getProfileShareUrl } from '../../src/utils/categories';
import { spacing, typography, radius, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.5;

// Default placeholder colors
const PLACEHOLDER_COLORS = ['#DC1B78', '#1DB7F8', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4'];
function getPlaceholderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

export default function FreelancerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [freelancer, setFreelancer] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => { if (id) loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      setIsLoading(true);
      const [res, reviewsRes] = await Promise.all([
        freelancersApi.getFreelancer(id as string),
        reviewsApi.getReviews(id as string).catch(() => ({ data: [] })),
      ]);
      setFreelancer(res.data);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      if (user) {
        const favRes = await favoritesApi.getFavorites();
        setIsFavorite(favRes.data.some((f: any) => f.id === id));
      }
    } catch (error) { console.error('Failed to load freelancer:', error); }
    finally { setIsLoading(false); }
  };

  const toggleFavorite = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    // Prevent self-like
    if (user.id === id) { Alert.alert('Info', 'Vous ne pouvez pas aimer votre propre profil'); return; }
    try {
      if (isFavorite) await favoritesApi.removeFavorite(id as string);
      else await favoritesApi.addFavorite(id as string);
      setIsFavorite(!isFavorite);
    } catch (error) { console.error(error); }
  };

  const shareProfile = async () => {
    if (!freelancer) return;
    const shareUrl = getProfileShareUrl(freelancer.profile_slug);
    try {
      await Share.share({
        message: `Découvrez le profil de ${freelancer.full_name} sur Harmoo : ${shareUrl}`,
        url: shareUrl,
        title: `${freelancer.full_name} - Harmoo`,
      });
    } catch (error) { console.error(error); }
  };

  const startConversation = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    try {
      // Open or create conversation WITHOUT sending any automatic message
      const res = await messagesApi.openConversation(freelancer.id);
      router.push({ pathname: '/chat/[conversationId]', params: { conversationId: res.data.id, name: freelancer.full_name, avatar: freelancer.avatar || '', receiverId: freelancer.id } });
    } catch (error) { console.error(error); }
  };

  const submitReview = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!reviewComment.trim()) { Alert.alert('Erreur', 'Ajoutez un commentaire'); return; }
    setIsSubmittingReview(true);
    try {
      await reviewsApi.createDirectReview({
        freelancer_id: id as string,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      await loadAll();
      Alert.alert('Merci !', 'Votre avis a été publié');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible de publier l\'avis');
    } finally { setIsSubmittingReview(false); }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!freelancer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}><Text style={[typography.h3, { color: theme.title }]}>Profil non trouvé</Text></View>
      </SafeAreaView>
    );
  }

  const avatarUrl = getAvatarUrl(freelancer.avatar, freelancer.full_name);
  const profession = getFirstSubcategoryLabel(freelancer.subcategories);
  const categoryName = freelancer.categories?.[0] ? getCategoryName(freelancer.categories[0]) : null;
  const hasAvatar = !!avatarUrl;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT * 0.4],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.6],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Full-screen header image with parallax */}
      <Animated.View style={[styles.headerImage, { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity }]}>
        {hasAvatar ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, { backgroundColor: getPlaceholderColor(freelancer.full_name) + '20' }]}>
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={80} color={getPlaceholderColor(freelancer.full_name)} />
            </View>
          </View>
        )}
      </Animated.View>

      {/* Header buttons */}
      <SafeAreaView style={styles.headerButtons} edges={['top']}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity style={styles.headerBtn} onPress={shareProfile}>
            <Ionicons name="share-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#FF4D6D' : '#FFF'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Scrollable content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: Platform.OS !== 'web' }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: HEADER_HEIGHT }} />

        {/* Content section with rounded top */}
        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          {/* Name Card */}
          <Card style={styles.nameCard} padding={spacing.lg}>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.displaySmall, { color: theme.title }]}>{freelancer.full_name}</Text>
                {/* Show specific profession, NOT "Artiste-Entrepreneur" */}
                <Text style={[typography.labelMedium, { color: theme.primary, marginTop: spacing.xs }]}>
                  {profession || 'Artiste-Entrepreneur'}
                </Text>
                {/* Organization name */}
                {freelancer.organization && (
                  <Text style={{ color: '#545454', fontWeight: '300', fontSize: 14, marginTop: 2 }}>
                    {freelancer.organization}
                  </Text>
                )}
              </View>
              {/* Membership badge */}
              {freelancer.is_harmoo_club && (
                <View style={styles.memberBadge}>
                  <Ionicons name="diamond" size={14} color="#FFF" />
                  <Text style={styles.memberBadgeText}>Membre</Text>
                </View>
              )}
            </View>

            {freelancer.city && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
                <Ionicons name="location-outline" size={15} color={theme.textSecondary} />
                <Text style={[typography.bodySmall, { color: theme.text }]}>{freelancer.city}</Text>
              </View>
            )}

            {/* Shareable profile link */}
            {freelancer.profile_slug && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}
                onPress={shareProfile}
              >
                <Ionicons name="link-outline" size={15} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.primary }]}>
                  harmoo/clu/{freelancer.profile_slug}
                </Text>
              </TouchableOpacity>
            )}

            {/* Stats Row */}
            <View style={[styles.statsRow, { borderTopColor: theme.divider }]}>
              <View style={styles.stat}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={[typography.h2, { color: theme.title }]}>{freelancer.rating?.toFixed(1) || '0.0'}</Text>
                </View>
                <Text style={[typography.tiny, { color: theme.textSecondary }]}>{freelancer.reviews_count || 0} avis</Text>
              </View>
              {freelancer.hourly_rate != null && (
                <View style={[styles.stat, styles.statBorder, { borderColor: theme.divider }]}>
                  <Text style={[typography.h2, { color: theme.primary }]}>Dès {freelancer.hourly_rate}€</Text>
                  <Text style={[typography.tiny, { color: theme.textSecondary }]}>Tarif</Text>
                </View>
              )}
              <View style={[styles.stat, styles.statBorder, { borderColor: theme.divider }]}>
                <View style={[styles.statusDot, { backgroundColor: freelancer.is_available ? '#10B981' : '#EF4444' }]} />
                <Text style={[typography.tiny, { color: theme.textSecondary }]}>{freelancer.is_available ? 'Disponible' : 'Indisponible'}</Text>
              </View>
            </View>
          </Card>

          {/* Categories as French labels */}
          {(freelancer.categories?.length > 0 || freelancer.subcategories?.length > 0) && (
            <View style={styles.tagsSection}>
              {freelancer.categories?.map((cat: string, i: number) => (
                <Badge key={`cat-${i}`} label={getCategoryName(cat)} variant="primary" size="medium" />
              ))}
              {freelancer.subcategories?.map((sub: string, i: number) => (
                <Badge key={`sub-${i}`} label={sub.charAt(0).toUpperCase() + sub.slice(1)} variant="secondary" size="medium" />
              ))}
            </View>
          )}

          {/* About */}
          {freelancer.bio && (
            <Card style={styles.section} padding={spacing.lg}>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.sm }]}>À propos</Text>
              <Text style={[typography.bodyMedium, { color: theme.text, lineHeight: 22 }]}>{freelancer.bio}</Text>
            </Card>
          )}

          {/* Services */}
          {freelancer.services?.length > 0 && (
            <Card style={styles.section} padding={spacing.lg}>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.md }]}>Services</Text>
              {freelancer.services.map((service: any, idx: number) => (
                <TouchableOpacity
                  key={service.id || idx}
                  style={[styles.serviceCard, { backgroundColor: theme.background }]}
                  onPress={() => router.push({ pathname: '/booking/[serviceId]', params: { serviceId: service.id } })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: theme.title }]}>{service.title}</Text>
                    {service.description && (
                      <Text style={[typography.caption, { color: theme.text, marginTop: spacing.xs }]} numberOfLines={2}>{service.description}</Text>
                    )}
                  </View>
                  <Text style={[typography.h2, { color: theme.primary, marginLeft: spacing.md }]}>{service.price}€</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Portfolio Section — ALWAYS visible */}
          <Card style={styles.section} padding={spacing.lg}>
            <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.md }]}>Portfolio</Text>
            {freelancer.portfolio && freelancer.portfolio.length > 0 ? (
              <FlatList
                data={freelancer.portfolio}
                keyExtractor={(item: any, idx: number) => item.id || String(idx)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: spacing.md }}
                renderItem={({ item }: { item: any }) => {
                  const link = item.youtube_url || item.spotify_url || item.instagram_url || item.tiktok_url || item.external_url;
                  const linkIcon = item.youtube_url ? 'logo-youtube' : item.spotify_url ? 'musical-notes' : item.instagram_url ? 'logo-instagram' : item.tiktok_url ? 'logo-tiktok' : item.external_url ? 'link-outline' : null;
                  return (
                    <TouchableOpacity
                      style={[styles.carouselItem, { backgroundColor: theme.background }]}
                      activeOpacity={link ? 0.7 : 1}
                      onPress={() => link && Linking.openURL(link)}
                    >
                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.carouselImage} />
                      )}
                      <View style={styles.carouselInfo}>
                        <Text style={[typography.labelMedium, { color: theme.title }]} numberOfLines={1}>{item.title}</Text>
                        {item.description ? (
                          <Text style={[typography.caption, { color: theme.text, marginTop: 2 }]} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        {link && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name={linkIcon as any} size={14} color={theme.primary} />
                            <Text style={[typography.caption, { color: theme.primary, marginLeft: 4 }]} numberOfLines={1}>Voir le projet</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyPortfolio}>
                <Ionicons name="images-outline" size={40} color={theme.textSecondary} />
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                  Portfolio vide
                </Text>
              </View>
            )}
          </Card>

          {/* Reviews Section */}
          <Card style={styles.section} padding={spacing.lg}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[typography.h3, { color: theme.title }]}>Avis ({reviews.length})</Text>
              {user && user.id !== freelancer.id && (
                <TouchableOpacity
                  style={[styles.addReviewBtn, { backgroundColor: theme.primarySoft }]}
                  onPress={() => setShowReviewModal(true)}
                >
                  <Ionicons name="create-outline" size={16} color={theme.primary} />
                  <Text style={[typography.labelMedium, { color: theme.primary }]}>Donner un avis</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviews.length === 0 ? (
              <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
                <Ionicons name="chatbubble-outline" size={32} color={theme.textSecondary} />
                <Text style={[typography.caption, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                  Aucun avis pour le moment
                </Text>
              </View>
            ) : (
              reviews.slice(0, 5).map((review: any, idx: number) => (
                <View key={review.id || idx} style={[styles.reviewCard, idx < reviews.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.divider }]}>
                  <View style={styles.reviewHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Avatar uri={review.reviewer_avatar} name={review.reviewer_name || 'User'} size={32} borderRadius={10} />
                      <View>
                        <Text style={[typography.labelMedium, { color: theme.title }]}>{review.reviewer_name || 'Utilisateur'}</Text>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={12} color="#FFB800" />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text style={[typography.tiny, { color: theme.textSecondary }]}>
                      {review.created_at ? formatDateFR(review.created_at) : ''}
                    </Text>
                  </View>
                  <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>{review.comment}</Text>
                </View>
              ))
            )}
          </Card>

          <View style={{ height: 120 }} />
        </View>
      </Animated.ScrollView>

      {/* Fixed Bottom Bar — hide for own profile */}
      {user?.id !== freelancer?.id && (
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <TouchableOpacity style={[styles.messageBtn, { borderColor: theme.primary }]} onPress={startConversation}>
          <Ionicons name="chatbubble-outline" size={18} color={theme.primary} />
          <Text style={[typography.labelLarge, { color: theme.primary, marginLeft: spacing.sm }]}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bookBtn, { backgroundColor: theme.primary }]}
          onPress={() => {
            if (freelancer.services?.length > 0) {
              router.push({ pathname: '/booking/[serviceId]', params: { serviceId: freelancer.services[0].id } });
            } else {
              Alert.alert('Info', 'Ce prestataire n\'a pas encore de service');
            }
          }}
        >
          <Text style={[typography.labelLarge, { color: '#FFF' }]}>Réserver</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* Review Modal — Glassmorphism with feathered edges */}
      <Modal visible={showReviewModal} animationType="slide" transparent onRequestClose={() => setShowReviewModal(false)}>
        <View style={styles.glassOverlay}>
          {/* Soft gradient backdrop — no hard edges */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowReviewModal(false)}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </TouchableOpacity>

          {/* Modal content with glass effect */}
          <View style={styles.glassModalContainer} pointerEvents="box-none">
            {/* Top feather gradient — creates the soft fade-in effect */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.9)']}
              locations={[0, 0.4, 1]}
              style={styles.glassFeatherTop}
              pointerEvents="none"
            />

            {Platform.OS !== 'web' ? (
              <BlurView intensity={50} tint="light" style={styles.glassSheet}>
                <View style={[styles.glassSheetInner, { backgroundColor: 'rgba(255,255,255,0.88)' }]}>
                  <View style={styles.glassModalHeader}>
                    <Text style={[typography.h2, { color: theme.title }]}>Donner un avis</Text>
                    <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                      <Ionicons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.md }]}>Note</Text>
                  <View style={styles.starsInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ padding: 4 }}>
                        <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={32} color="#FFB800" />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Commentaire</Text>
                  <TextInput
                    style={[styles.reviewInput, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <Button
                    title="Publier l'avis"
                    onPress={submitReview}
                    isLoading={isSubmittingReview}
                    style={{ marginTop: spacing.xl }}
                  />
                </View>
              </BlurView>
            ) : (
              <View style={styles.glassSheetWeb}>
                <View style={[styles.glassSheetInner, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                  <View style={styles.glassModalHeader}>
                    <Text style={[typography.h2, { color: theme.title }]}>Donner un avis</Text>
                    <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                      <Ionicons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.md }]}>Note</Text>
                  <View style={styles.starsInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setReviewRating(star)} style={{ padding: 4 }}>
                        <Ionicons name={star <= reviewRating ? 'star' : 'star-outline'} size={32} color="#FFB800" />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.xl, marginBottom: spacing.sm }]}>Commentaire</Text>
                  <TextInput
                    style={[styles.reviewInput, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <Button
                    title="Publier l'avis"
                    onPress={submitReview}
                    isLoading={isSubmittingReview}
                    style={{ marginTop: spacing.xl }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerImage: { position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_HEIGHT, zIndex: 0 },
  profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  profilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Ultra-transparent overlay on the header image
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxl + 8,
  },
  headerOverlayContent: {},
  overlayName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  overlayProfession: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  overlayMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  overlayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overlayMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  headerButtons: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  contentContainer: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -24,
    paddingTop: spacing.sm,
  },
  nameCard: { marginHorizontal: spacing.xl },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#10B981', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.xs,
  },
  memberBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', marginTop: spacing.lg,
    paddingTop: spacing.lg, borderTopWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center', gap: spacing.xs },
  statBorder: { borderLeftWidth: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  tagsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, marginTop: spacing.md },
  section: { marginHorizontal: spacing.xl, marginTop: spacing.md },
  serviceCard: {
    padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm,
    flexDirection: 'row', alignItems: 'center',
  },
  // Portfolio
  portfolioGrid: { gap: spacing.md },
  portfolioItem: {
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.sm,
    resizeMode: 'cover',
  },
  carouselItem: {
    width: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  carouselImage: {
    width: 180,
    height: 120,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  carouselInfo: {
    padding: spacing.sm,
  },
  emptyPortfolio: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  addReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  reviewCard: { paddingVertical: spacing.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewStars: { flexDirection: 'row', gap: 1, marginTop: 2 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
  },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5,
  },
  bookBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.md, borderRadius: radius.lg,
  },
  // Glassmorphism modal styles
  glassOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  glassModalContainer: {
    position: 'relative',
  },
  glassFeatherTop: {
    position: 'absolute',
    top: -36,
    left: -12,
    right: -12,
    height: 44,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 5,
  },
  glassSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 32,
  },
  glassSheetWeb: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 32,
    // @ts-ignore — web only
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  },
  glassSheetInner: {
    padding: spacing.xxl,
    paddingBottom: 44,
  },
  glassModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  starsInput: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  reviewInput: {
    borderWidth: 1, borderRadius: radius.md,
    padding: spacing.lg, minHeight: 100,
    ...typography.bodyMedium,
  },
});
