import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;
const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

// Couleurs de dégradé aléatoires pour les cartes sans avatar
const GRADIENT_COLORS = [
  ['#1a1a2e', '#16213e'],
  ['#2d132c', '#801336'],
  ['#1b1b2f', '#162447'],
  ['#0f0e17', '#2e2e3a'],
  ['#1f1c2c', '#928dab'],
  ['#232526', '#414345'],
];

export default function MembersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      const res = await api.get('/freelancers?limit=100&skip=0');
      setMembers(res.data.filter((f: any) => f.email !== HARMOO_ADMIN_EMAIL));
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const getAvatarUrl = (id: string) => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
    return `${base}/api/avatar/${id}`;
  };

  const getGradient = (index: number) => GRADIENT_COLORS[index % GRADIENT_COLORS.length];

  const renderMember = ({ item, index }: any) => {
    const hasAvatar = !!item.avatar;
    const initials = item.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/freelancer/[id]', params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <View style={styles.cardImage}>
          {hasAvatar ? (
            <>
              <Image source={{ uri: getAvatarUrl(item.id) }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
              {/* Dégradé noir en bas pour lisibilité du texte */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageOverlay}
              />
            </>
          ) : (
            <LinearGradient colors={getGradient(index) as [string, string]} style={[StyleSheet.absoluteFillObject, styles.gradientBg]}>
              <Text style={styles.initials}>{initials}</Text>
            </LinearGradient>
          )}
          
          {/* Badge Club */}
          {item.is_harmoo_club && (
            <View style={styles.badge}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>Club</Text>
            </View>
          )}
          
          {/* Infos sur la carte (texte blanc) */}
          <View style={styles.cardInfo}>
            <Text style={styles.memberName} numberOfLines={1}>{item.full_name}</Text>
            <Text style={styles.memberRole} numberOfLines={1}>
              {item.subcategories?.[0] || item.categories?.[0] || ''}
            </Text>
            {item.categories?.[0] && (
              <Text style={styles.memberCategory}>{item.categories[0].toUpperCase()}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Membres</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.lg }}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
          ListEmptyComponent={<Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 40 }]}>Aucun membre pour le moment</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  card: { width: CARD_WIDTH, borderRadius: radius.lg, overflow: 'hidden' },
  cardImage: { width: '100%', aspectRatio: 0.75, position: 'relative' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  gradientBg: { justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 42, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#DC1B78', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.sm },
  memberName: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  memberRole: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  memberCategory: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 0.5 },
});
