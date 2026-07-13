import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { BurgerMenu } from '../../src/components/BurgerMenu';
import { spacing, radius, typography } from '../../src/theme';
import api from '../../src/services/api';

const { width } = Dimensions.get('window');
const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

// Logo dimensions - responsive
const LOGO_HEIGHT = 28;
const LOGO_WIDTH = 140; // Aspect ratio ~5:1

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [harmooClub, setHarmooClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHarmooClub();
  }, []);

  const loadHarmooClub = async () => {
    try {
      const res = await api.get('/freelancers?limit=50&skip=0');
      const hc = res.data.find((f: any) => f.email === HARMOO_ADMIN_EMAIL);
      if (hc) setHarmooClub(hc);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const getAvatarUrl = (id: string) => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
    return `${base}/api/avatar/${id}`;
  };

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
            Bonjour{user ? `, ${user.full_name}` : ''} 👋
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
        </View>
        <TouchableOpacity style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="logo-youtube" size={40} color="#FF0000" />
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>Vidéo à venir</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Le contenu YouTube sera affiché ici</Text>
        </TouchableOpacity>

        {/* Événements preview */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.h3, { color: theme.title }]}>Événements</Text>
          <TouchableOpacity onPress={() => router.push('/events' as any)}>
            <Text style={[typography.labelMedium, { color: theme.primary }]}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.placeholderCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => router.push('/events' as any)}
        >
          <Ionicons name="calendar" size={40} color={theme.primary} />
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>Événements à venir</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Les événements Shotgun seront affichés ici</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  logoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
  heroSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  studioCard: { marginHorizontal: spacing.lg, height: 280, borderRadius: radius.xl, overflow: 'hidden' },
  studioOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', padding: spacing.xl },
  studioBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  studioTitle: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  studioSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  studioBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DC1B78', alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  placeholderCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  clubCard: { marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.lg },
  clubIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220,27,120,0.1)', justifyContent: 'center', alignItems: 'center' },
});
