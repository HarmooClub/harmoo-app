import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform, TextInput, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { BurgerMenu } from '../../src/components/BurgerMenu';
import { spacing, radius, typography } from '../../src/theme';
import api, { siteSettingsApi, eventsApi } from '../../src/services/api';

const { width } = Dimensions.get('window');
const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

// Logo dimensions - responsive
const LOGO_HEIGHT = 28;
const LOGO_WIDTH = 140;

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [harmooClub, setHarmooClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  
  // Admin edit states
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [freelancersRes, settingsRes, eventsRes] = await Promise.all([
        api.get('/freelancers?limit=50&skip=0'),
        siteSettingsApi.get().catch(() => ({ data: {} })),
        eventsApi.getAll().catch(() => ({ data: [] })),
      ]);
      
      const hc = freelancersRes.data.find((f: any) => f.email === HARMOO_ADMIN_EMAIL);
      if (hc) setHarmooClub(hc);
      
      setYoutubeUrl(settingsRes.data?.youtube_url || null);
      setEvents(eventsRes.data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const getAvatarUrl = (id: string) => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
    return `${base}/api/avatar/${id}`;
  };

  const saveYoutubeUrl = async () => {
    setSaving(true);
    try {
      await siteSettingsApi.update({ youtube_url: editYoutubeUrl });
      setYoutubeUrl(editYoutubeUrl);
      setShowYoutubeModal(false);
      Alert.alert('Succès', 'Lien YouTube mis à jour');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  };

  const openYoutubeVideo = () => {
    if (youtubeUrl) {
      Linking.openURL(youtubeUrl);
    }
  };

  const videoId = getYouTubeVideoId(youtubeUrl || '');
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header with centered logo */}
      <View style={styles.header}>
        <BurgerMenu />
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/harmoo-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero: Greeting */}
        <View style={styles.heroSection}>
          <Text style={[typography.h1, { color: theme.title }]}>
            Bonjour{user ? `, ${user.full_name?.split(' ')[0]}` : ''} 👋
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: 4 }]}>
            Bienvenue chez Harmoo Club
          </Text>
        </View>

        {/* CTA: Book Studio Session */}
        {harmooClub ? (
          <TouchableOpacity
            style={styles.studioCard}
            activeOpacity={0.9}
            onPress={() => {
              if (harmooClub.services?.length > 0) {
                router.push({ pathname: '/booking/[serviceId]', params: { serviceId: harmooClub.services[0].id } });
              } else {
                router.push({ pathname: '/freelancer/[id]', params: { id: harmooClub.id } });
              }
            }}
          >
            <Image
              source={{ uri: getAvatarUrl(harmooClub.id) }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
            />
            <View style={styles.studioOverlay}>
              <View style={styles.studioBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#1DA1F2" />
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13, marginLeft: 4 }}>HARMOO CLUB</Text>
              </View>
              <Text style={styles.studioTitle}>Studio d'enregistrement</Text>
              <Text style={styles.studioSubtitle}>Réserve ta session dès maintenant</Text>
              <View style={styles.studioBtn}>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Réserver</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </View>
            </View>
          </TouchableOpacity>
        ) : loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : null}

        {/* Actualité YouTube */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: theme.title }]}>Actualité</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => { setEditYoutubeUrl(youtubeUrl || ''); setShowYoutubeModal(true); }}>
              <Ionicons name="pencil" size={18} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {thumbnailUrl ? (
          <TouchableOpacity style={styles.youtubeCard} onPress={openYoutubeVideo} activeOpacity={0.9}>
            <Image source={{ uri: thumbnailUrl }} style={styles.youtubeThumbnail} contentFit="cover" />
            <View style={styles.youtubePlayBtn}>
              <Ionicons name="play" size={32} color="#FFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={isAdmin ? () => { setEditYoutubeUrl(''); setShowYoutubeModal(true); } : undefined}
          >
            <Ionicons name="logo-youtube" size={40} color="#FF0000" />
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>Vidéo à venir</Text>
            {isAdmin && <Text style={[typography.caption, { color: theme.primary, marginTop: 4 }]}>Appuie pour ajouter un lien</Text>}
          </TouchableOpacity>
        )}

        {/* Événements preview */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: theme.title }]}>Événements</Text>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={[typography.labelMedium, { color: theme.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {events.length > 0 ? (
          <TouchableOpacity
            style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => events[0].shotgun_url ? Linking.openURL(events[0].shotgun_url) : router.push('/events' as any)}
          >
            <Ionicons name="calendar" size={32} color={theme.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[typography.h4, { color: theme.title }]}>{events[0].title}</Text>
              {events[0].date && <Text style={[typography.caption, { color: theme.textSecondary }]}>{events[0].date}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/events' as any)}
          >
            <Ionicons name="calendar" size={40} color={theme.primary} />
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>Événements à venir</Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>Les événements seront affichés ici</Text>
          </TouchableOpacity>
        )}

        {/* Harmoo Club Membership */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: theme.title }]}>Rejoins le Club</Text>
        </View>
        <TouchableOpacity
          style={[styles.clubCard, { borderColor: '#DC1B78' }]}
          onPress={() => router.push('/membership' as any)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.clubIcon}>
              <Ionicons name="diamond" size={24} color="#DC1B78" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[typography.h3, { color: theme.title }]}>Harmoo Club</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>Adhésion à vie • 60€</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#DC1B78" />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* YouTube URL Modal */}
      <Modal visible={showYoutubeModal} transparent animationType="fade" onRequestClose={() => setShowYoutubeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>Lien vidéo YouTube</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
              value={editYoutubeUrl}
              onChangeText={setEditYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.background }]} onPress={() => setShowYoutubeModal(false)}>
                <Text style={[typography.labelMedium, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={saveYoutubeUrl} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[typography.labelMedium, { color: '#FFF' }]}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
  heroSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  studioCard: { marginHorizontal: spacing.lg, height: 420, borderRadius: radius.xl, overflow: 'hidden' },
  studioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: spacing.xl },
  studioBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  studioTitle: { color: '#FFF', fontSize: 26, fontWeight: '800' },
  studioSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 },
  studioBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DC1B78', alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  placeholderCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  youtubeCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', height: 200, position: 'relative' },
  youtubeThumbnail: { width: '100%', height: '100%' },
  youtubePlayBtn: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -28 }, { translateY: -28 }], width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  eventCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  clubCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.lg },
  clubIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220,27,120,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: radius.xl, padding: spacing.xl },
  input: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});
