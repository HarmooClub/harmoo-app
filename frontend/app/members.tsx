import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;
const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

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

  const renderMember = ({ item }: any) => {
    const hasAvatar = !!item.avatar;
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => router.push({ pathname: '/freelancer/[id]', params: { id: item.id } })}
        activeOpacity={0.85}
      >
        <View style={styles.cardImage}>
          {hasAvatar ? (
            <Image source={{ uri: getAvatarUrl(item.id) }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={200} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 32, fontWeight: '700', color: theme.primary }}>{item.full_name?.[0]}</Text>
            </View>
          )}
          {item.is_harmoo_club && (
            <View style={styles.badge}>
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>Club</Text>
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={[typography.labelMedium, { color: theme.title }]} numberOfLines={1}>{item.full_name}</Text>
          <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.subcategories?.[0] || item.categories?.[0] || ''}
          </Text>
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
  cardImage: { width: '100%', aspectRatio: 0.85 },
  cardInfo: { padding: spacing.sm },
  badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#DC1B78', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
});
