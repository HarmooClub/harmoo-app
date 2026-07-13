import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

export default function ReserveScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [harmooId, setHarmooId] = useState<string>('');

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      const res = await api.get('/freelancers?limit=50&skip=0');
      const hc = res.data.find((f: any) => f.email === HARMOO_ADMIN_EMAIL);
      if (hc) {
        setHarmooId(hc.id);
        setServices(hc.services || []);
      }
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const getAvatarUrl = (id: string) => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
    return `${base}/api/avatar/${id}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Réserver</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Studio header */}
        <View style={styles.studioHeader}>
          {harmooId ? (
            <Image source={{ uri: getAvatarUrl(harmooId) }} style={styles.studioImage} contentFit="cover" />
          ) : null}
          <View style={styles.studioInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[typography.h2, { color: theme.title }]}>Harmoo Club</Text>
              <Ionicons name="checkmark-circle" size={18} color="#1DA1F2" />
            </View>
            <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Studio d'enregistrement • Le Mans</Text>
          </View>
        </View>

        {/* Services */}
        <Text style={[typography.h3, { color: theme.title, marginTop: spacing.xl, marginBottom: spacing.md }]}>Sessions disponibles</Text>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : services.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="mic-outline" size={40} color={theme.textSecondary} />
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md }]}>Aucune session disponible pour le moment</Text>
          </View>
        ) : (
          services.map((service: any) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push({ pathname: '/booking/[serviceId]', params: { serviceId: service.id } })}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.h3, { color: theme.title }]}>{service.title}</Text>
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]} numberOfLines={2}>{service.description}</Text>
                {service.duration && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>{service.duration}</Text>
                  </View>
                )}
              </View>
              <View style={styles.priceSection}>
                <Text style={[typography.h2, { color: theme.primary }]}>{service.price}€</Text>
                <View style={[styles.bookBtn, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>Réserver</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  studioHeader: { flexDirection: 'row', alignItems: 'center' },
  studioImage: { width: 72, height: 72, borderRadius: 20 },
  studioInfo: { marginLeft: spacing.md, flex: 1 },
  serviceCard: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  priceSection: { alignItems: 'flex-end', justifyContent: 'space-between', marginLeft: spacing.md },
  bookBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  emptyCard: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.xl, alignItems: 'center' },
});
