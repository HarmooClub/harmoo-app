import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, TextInput, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { BurgerMenu } from '../../src/components/BurgerMenu';
import { spacing, radius, shadows } from '../../src/theme';
import api, { siteSettingsApi, eventsApi } from '../../src/services/api';

const { width } = Dimensions.get('window');
const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';
const LOGO_HEIGHT = 28;
const LOGO_WIDTH = 140;

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
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  useEffect(() => { loadAll(); }, []);

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
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  };

  const videoId = getYouTubeVideoId(youtubeUrl || '');
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <BurgerMenu />
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/harmoo-logo.png')} style={styles.logo} contentFit="contain" />
        </View>
        {/* Icon buttons like Podlabs */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.card }]} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-outline" size={18} color={theme.title} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Studio Card */}
        {harmooClub ? (
          <TouchableOpacity
            style={styles.studioCard}
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/freelancer/[id]', params: { id: harmooClub.id } })}
          >
            <Image source={{ uri: getAvatarUrl(harmooClub.id) }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(10,14,26,0.95)']} style={styles.studioGradient} />
            <View style={styles.studioOverlay}>
              {/* Badge */}
              <View style={styles.studioBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
                <Text style={styles.studioBadgeText}>{harmooClub.full_name?.toUpperCase() || 'HARMOO STUDIO'}</Text>
              </View>
              <Text style={styles.studioTitle}>Studio d'enregistrement</Text>
              <Text style={styles.studioSubtitle}>Faites grandir votre communauté grâce au podcast</Text>
              <TouchableOpacity style={styles.studioBtn}>
                <Ionicons name="calendar-outline" size={18} color="#FFF" />
                <Text style={styles.studioBtnText}>Réserver</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : null}

        {/* Actualité Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actualité</Text>
          {isAdmin && (
            <TouchableOpacity onPress={() => { setEditYoutubeUrl(youtubeUrl || ''); setShowYoutubeModal(true); }}>
              <Ionicons name="pencil-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        {thumbnailUrl ? (
          <TouchableOpacity style={styles.youtubeCard} onPress={() => youtubeUrl && Linking.openURL(youtubeUrl)} activeOpacity={0.9}>
            <Image source={{ uri: thumbnailUrl }} style={styles.youtubeThumbnail} contentFit="cover" />
            <View style={styles.youtubePlayBtn}>
              <Ionicons name="play" size={28} color="#FFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={isAdmin ? () => { setEditYoutubeUrl(''); setShowYoutubeModal(true); } : undefined}
          >
            <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(255,0,0,0.1)' }]}>
              <Ionicons name="logo-youtube" size={28} color="#FF0000" />
            </View>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Vidéo à venir</Text>
          </TouchableOpacity>
        )}

        {/* Événements Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Événements</Text>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {events.length > 0 ? (
          <TouchableOpacity
            style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => events[0].shotgun_url ? Linking.openURL(events[0].shotgun_url) : router.push('/events' as any)}
          >
            <View style={[styles.eventIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="calendar-outline" size={22} color="#3B82F6" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.eventTitle, { color: theme.title }]}>{events[0].title}</Text>
              {events[0].date && <Text style={[styles.eventDate, { color: theme.textSecondary }]}>{events[0].date}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="calendar-outline" size={28} color="#3B82F6" />
            </View>
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Événements à venir</Text>
          </View>
        )}

        {/* Join Club Button */}
        <TouchableOpacity style={styles.joinClubBtn} onPress={() => router.push('/membership' as any)}>
          <Text style={styles.joinClubText}>Nous rejoindre</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* YouTube Modal */}
      <Modal visible={showYoutubeModal} transparent animationType="fade" onRequestClose={() => setShowYoutubeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.title }]}>Lien vidéo YouTube</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
              value={editYoutubeUrl}
              onChangeText={setEditYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowYoutubeModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={saveYoutubeUrl} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnText}>Enregistrer</Text>}
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
  logoContainer: { flex: 1, alignItems: 'center' },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  
  // Studio Card - Premium style with shadow
  studioCard: { marginHorizontal: spacing.lg, height: 480, borderRadius: 20, overflow: 'hidden', position: 'relative', ...shadows.lg },
  studioGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' },
  studioOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl },
  studioBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(59,130,246,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', marginBottom: 12 },
  studioBadgeText: { color: '#FFF', fontWeight: '600', fontSize: 11, marginLeft: 6, letterSpacing: 0.5 },
  studioTitle: { color: '#FFF', fontSize: 28, fontWeight: '700', letterSpacing: -0.5, lineHeight: 34 },
  studioSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 8, lineHeight: 22 },
  studioBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DC1B78', alignSelf: 'flex-start', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, marginTop: 20, gap: 8, ...shadows.glow },
  studioBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  
  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  
  // YouTube card with shadow
  youtubeCard: { marginHorizontal: spacing.lg, borderRadius: 16, overflow: 'hidden', height: 200, position: 'relative', ...shadows.md },
  youtubeThumbnail: { width: '100%', height: '100%' },
  youtubePlayBtn: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -26 }, { translateY: -26 }], width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,0,0,0.9)', justifyContent: 'center', alignItems: 'center', ...shadows.md },
  
  // Placeholder card with shadow
  placeholderCard: { marginHorizontal: spacing.lg, borderRadius: 16, borderWidth: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: 120, ...shadows.sm },
  placeholderIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  placeholderText: { fontSize: 14, fontWeight: '500' },
  
  // Event card with shadow
  eventCard: { marginHorizontal: spacing.lg, borderRadius: 16, borderWidth: 1, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', ...shadows.sm },
  eventIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  eventTitle: { fontSize: 16, fontWeight: '600' },
  eventDate: { fontSize: 13, marginTop: 2 },
  
  // Join button with glow
  joinClubBtn: { marginHorizontal: spacing.lg, marginTop: spacing.xxl, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#DC1B78', ...shadows.glow },
  joinClubText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  // Modal with shadow
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: 20, padding: spacing.xl, ...shadows.lg },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.md, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
