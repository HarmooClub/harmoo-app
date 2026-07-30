import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radius, shadows } from '../src/theme';
import api from '../src/services/api';

export default function MembershipScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clubInfo, setClubInfo] = useState<any>(null);

  useEffect(() => { loadClubInfo(); }, []);

  const loadClubInfo = async () => {
    try {
      const res = await api.get('/club/status');
      setClubInfo(res.data);
    } catch (e) { console.warn(e); }
  };

  const handleJoinClub = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    setLoading(true);
    try {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://harmooclub.com';
      const res = await api.post('/club/checkout', { origin_url: originUrl });
      if (res.data?.checkout_url) {
        if (typeof window !== 'undefined') window.location.href = res.data.checkout_url;
        else Linking.openURL(res.data.checkout_url);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de créer la session de paiement');
    } finally { setLoading(false); }
  };

  const isClubMember = user?.is_harmoo_club;
  const spotsLeft = clubInfo?.spots_left ?? 50;

  const benefits = [
    { icon: 'mic-outline', text: 'Accès illimité au studio' },
    { icon: 'pricetag-outline', text: 'Tarifs préférentiels' },
    { icon: 'ticket-outline', text: 'Accès aux événements privés' },
    { icon: 'checkmark-circle-outline', text: 'Badge membre vérifié' },
    { icon: 'headset-outline', text: 'Support prioritaire' },
    { icon: 'people-outline', text: 'Communauté exclusive' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Harmoo Club</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="diamond" size={40} color="#DC1B78" />
          </View>
          <Text style={[styles.heroTitle, { color: theme.title }]}>Rejoins le Club</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Adhésion à vie • Paiement unique</Text>
        </View>

        {/* Price Card */}
        <View style={[styles.priceCard, { backgroundColor: theme.card, borderColor: '#DC1B78' }]}>
          <View style={styles.priceHeader}>
            <Text style={styles.price}>60€</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>À VIE</Text>
            </View>
          </View>
          {spotsLeft <= 50 && (
            <Text style={[styles.spotsText, { color: theme.textSecondary }]}>{spotsLeft} places restantes</Text>
          )}

          <View style={styles.benefits}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={[styles.benefitIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <Ionicons name={b.icon as any} size={18} color="#10B981" />
                </View>
                <Text style={[styles.benefitText, { color: theme.title }]}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        {isClubMember ? (
          <View style={[styles.memberBadge, { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.memberBadgeText}>Tu es membre du Club !</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoinClub} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <Text style={styles.joinBtnText}>Rejoindre pour 60€</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.secureText, { color: theme.textSecondary }]}>Paiement sécurisé par Stripe</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(220,27,120,0.15)', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '700', marginTop: spacing.lg, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, marginTop: 4 },
  priceCard: { borderRadius: 20, borderWidth: 2, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.lg },
  priceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 48, fontWeight: '800', color: '#DC1B78' },
  priceBadge: { backgroundColor: '#DC1B78', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  priceBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  spotsText: { fontSize: 13, marginTop: 4 },
  benefits: { marginTop: spacing.xl, gap: spacing.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  benefitText: { fontSize: 15, fontWeight: '500' },
  memberBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, borderWidth: 1, gap: 8 },
  memberBadgeText: { color: '#10B981', fontSize: 16, fontWeight: '600' },
  joinBtn: { backgroundColor: '#DC1B78', paddingVertical: 18, borderRadius: 12, alignItems: 'center', ...shadows.glow },
  joinBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  secureText: { fontSize: 13, textAlign: 'center', marginTop: spacing.md },
});
