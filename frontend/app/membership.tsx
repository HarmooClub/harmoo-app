import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

export default function MembershipScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clubInfo, setClubInfo] = useState<any>(null);

  useEffect(() => {
    loadClubInfo();
  }, []);

  const loadClubInfo = async () => {
    try {
      const res = await api.get('/club/status');
      setClubInfo(res.data);
    } catch (e) { console.warn(e); }
  };

  const handleJoinClub = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://harmooclub.com';
      const res = await api.post('/club/checkout', { origin_url: originUrl });
      
      if (res.data?.checkout_url) {
        if (typeof window !== 'undefined') {
          window.location.href = res.data.checkout_url;
        } else {
          Linking.openURL(res.data.checkout_url);
        }
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de créer la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  const isClubMember = user?.is_harmoo_club;
  const spotsLeft = clubInfo?.spots_left ?? 50;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.title }]}>Harmoo Club</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(220,27,120,0.1)' }]}>
            <Ionicons name="diamond" size={48} color="#DC1B78" />
          </View>
          <Text style={[typography.h1, { color: theme.title, marginTop: spacing.lg, textAlign: 'center' }]}>
            Rejoins le Club
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            Adhésion à vie • Paiement unique
          </Text>
        </View>

        {/* Price Card */}
        <View style={[styles.priceCard, { backgroundColor: theme.card, borderColor: '#DC1B78' }]}>
          <View style={styles.priceHeader}>
            <Text style={[styles.price, { color: '#DC1B78' }]}>60€</Text>
            <View style={[styles.badge, { backgroundColor: '#DC1B78' }]}>
              <Text style={styles.badgeText}>À VIE</Text>
            </View>
          </View>
          
          {spotsLeft <= 50 && (
            <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
              {spotsLeft} places restantes
            </Text>
          )}

          <View style={styles.benefits}>
            {[
              'Accès illimité au studio',
              'Tarifs préférentiels',
              'Accès aux événements privés',
              'Badge membre vérifié',
              'Support prioritaire',
              'Communauté exclusive',
            ].map((benefit, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={[typography.body, { color: theme.title, marginLeft: 10 }]}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Button */}
        {isClubMember ? (
          <View style={[styles.memberBadge, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={[typography.labelLarge, { color: '#10B981', marginLeft: 8 }]}>Tu es membre du Club !</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: '#DC1B78' }]}
            onPress={handleJoinClub}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="diamond" size={20} color="#FFF" />
                <Text style={[typography.labelLarge, { color: '#FFF', marginLeft: 8 }]}>Rejoindre pour 60€</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.md }]}>
          Paiement sécurisé par Stripe
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  priceCard: { borderRadius: radius.xl, borderWidth: 2, padding: spacing.xl, marginBottom: spacing.xl },
  priceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 48, fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  benefits: { marginTop: spacing.xl, gap: spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radius.lg },
  memberBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radius.lg, borderWidth: 1 },
});
