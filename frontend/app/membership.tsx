import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { subscriptionsApi } from '../src/services/api';
import { spacing, typography, radius } from '../src/theme';

// Web-compatible button
const WebButton = ({ onPress, style, children }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div 
        onClick={onPress} 
        style={{
          ...style,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
};

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: 0,
    priceLabel: 'Gratuit',
    color: '#6B7280',
    features: [
      { text: '1 service', included: true },
      { text: 'Commission 15%', included: true },
      { text: 'Versement mensuel', included: true },
      { text: 'Tableau de bord', included: true },
      { text: 'Support téléphonique', included: false },
      { text: 'Versement instantané', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 2.99,
    priceLabel: '2,99€/mois',
    color: '#DC1B78',
    popular: true,
    features: [
      { text: '2 services', included: true },
      { text: 'Commission 6%', included: true },
      { text: 'Versement tous les 15j', included: true },
      { text: 'Tableau de bord', included: true },
      { text: 'Support téléphonique 7/7', included: true },
      { text: 'Versement instantané', included: false },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 7.99,
    priceLabel: '7,99€/mois',
    color: '#10B981',
    features: [
      { text: '3 services', included: true },
      { text: '0% commission', included: true },
      { text: 'Versement instantané', included: true },
      { text: 'Tableau de bord', included: true },
      { text: 'Support téléphonique 7/7', included: true },
      { text: 'Priorité affichage', included: true },
    ],
  },
];

const CLUB_PRICE = 30;
const CLUB_MAX_MEMBERS = 50;

export default function MembershipScreen() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clubMembersCount, setClubMembersCount] = useState(0);

  const currentTier = user?.subscription_tier || 'essentiel';
  const isClubMember = user?.is_harmoo_club || false;

  useEffect(() => {
    fetchSubscription();
    fetchClubCount();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionsApi.getStatus();
      setSubscriptionInfo(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClubCount = async () => {
    try {
      const response = await subscriptionsApi.getClubCount();
      setClubMembersCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching club count:', error);
    }
  };

  const handleJoinClub = () => {
    router.push('/club-checkout');
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === currentTier) return;
    router.push(`/subscription-checkout?tier=${planId}`);
  };

  const handleCancel = async () => {
    Alert.alert(
      'Résilier l\'abonnement',
      'Votre abonnement sera actif jusqu\'à la fin de la période en cours. Voulez-vous continuer ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, résilier',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await subscriptionsApi.cancel();
              Alert.alert('Abonnement résilié', response.data.message);
              fetchSubscription();
            } catch (error: any) {
              Alert.alert('Erreur', error.response?.data?.detail || 'Erreur');
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    try {
      await subscriptionsApi.reactivate();
      Alert.alert('Succès', 'Votre abonnement a été réactivé');
      fetchSubscription();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ScreenHeader title="Abonnement" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Abonnement" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* HARMOO CLUB Section */}
        <View style={[styles.clubCard, { backgroundColor: theme.card, borderColor: '#DC1B78' }]}>
          <View style={styles.clubHeader}>
            <View style={[styles.clubBadge, { backgroundColor: '#DC1B78' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>CLUB</Text>
            </View>
            <Text style={[typography.h2, { color: theme.title, flex: 1 }]}>Harmoo Club</Text>
            {isClubMember && (
              <View style={[styles.memberBadge, { backgroundColor: '#DC1B78' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11, marginLeft: 4 }}>Membre</Text>
              </View>
            )}
          </View>

          <Text style={[typography.bodySmall, { color: theme.text, marginBottom: spacing.md }]}>
            Rejoignez les {CLUB_MAX_MEMBERS} premiers membres fondateurs et bénéficiez d'avantages exclusifs à vie.
          </Text>

          <View style={styles.clubFeatures}>
            <View style={styles.clubFeatureRow}>
              <Ionicons name="star" size={18} color="#DC1B78" />
              <Text style={[typography.bodySmall, { color: theme.text, marginLeft: spacing.sm }]}>Badge "Club" sur votre profil</Text>
            </View>
            <View style={styles.clubFeatureRow}>
              <Ionicons name="calendar" size={18} color="#DC1B78" />
              <Text style={[typography.bodySmall, { color: theme.text, marginLeft: spacing.sm }]}>Accès aux événements exclusifs</Text>
            </View>
            <View style={styles.clubFeatureRow}>
              <Ionicons name="pricetag" size={18} color="#DC1B78" />
              <Text style={[typography.bodySmall, { color: theme.text, marginLeft: spacing.sm }]}>Réductions sur les prestations</Text>
            </View>
          </View>

          <View style={styles.clubPriceRow}>
            <Text style={[typography.displaySmall, { color: '#DC1B78' }]}>{CLUB_PRICE}€</Text>
            <Text style={[typography.bodySmall, { color: theme.textSecondary, marginLeft: spacing.sm }]}>paiement unique • à vie</Text>
          </View>

          {!isClubMember && clubMembersCount < CLUB_MAX_MEMBERS && (
            <>
              <Text style={[typography.tiny, { color: '#DC1B78', textAlign: 'center', marginBottom: spacing.sm }]}>
                {CLUB_MAX_MEMBERS - clubMembersCount} places restantes sur {CLUB_MAX_MEMBERS}
              </Text>
              <WebButton
                onPress={handleJoinClub}
                style={{
                  backgroundColor: '#DC1B78',
                  paddingVertical: 14,
                  borderRadius: 12,
                  marginTop: spacing.sm,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Rejoindre le Club</Text>
              </WebButton>
            </>
          )}

          {!isClubMember && clubMembersCount >= CLUB_MAX_MEMBERS && (
            <View style={[styles.soldOutBadge, { backgroundColor: theme.border }]}>
              <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>Complet</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Current Plan Banner */}
        {subscriptionInfo?.cancel_at_period_end && (
          <View style={[styles.warningBanner, { backgroundColor: theme.warningSoft }]}>
            <Ionicons name="warning" size={20} color={theme.warning} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[typography.labelMedium, { color: theme.warning }]}>Abonnement en cours de résiliation</Text>
              <Text style={[typography.tiny, { color: theme.warning }]}>Actif jusqu'au {new Date(subscriptionInfo.current_period_end).toLocaleDateString('fr-FR')}</Text>
            </View>
            <TouchableOpacity onPress={handleReactivate}>
              <Text style={[typography.labelSmall, { color: theme.primary }]}>Réactiver</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.sm }]}>Choisissez votre formule</Text>
        <Text style={[typography.bodySmall, { color: theme.textSecondary, marginBottom: spacing.xl }]}>
          Sans engagement • Résiliable à tout moment
        </Text>

        {/* Plans */}
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const isSelected = plan.id === selectedPlan;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: theme.card, borderRadius: radius.xl },
                isCurrent && { borderColor: plan.color, borderWidth: 2 },
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularText}>Populaire</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[typography.h3, { color: theme.title }]}>{plan.name}</Text>
                  <Text style={[typography.displaySmall, { color: plan.color }]}>{plan.priceLabel}</Text>
                </View>
                {isCurrent && (
                  <View style={[styles.currentBadge, { backgroundColor: plan.color + '20' }]}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={[typography.tiny, { color: plan.color, fontWeight: '600' }]}>Actuel</Text>
                  </View>
                )}
              </View>

              <View style={styles.featuresContainer}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons
                      name={feature.included ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={feature.included ? theme.success : theme.textSecondary}
                    />
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: feature.included ? theme.text : theme.textSecondary, marginLeft: spacing.sm },
                      ]}
                    >
                      {feature.text}
                    </Text>
                  </View>
                ))}
              </View>

              {!isCurrent && (
                <WebButton
                  onPress={() => handleSelectPlan(plan.id)}
                  style={{
                    backgroundColor: plan.color,
                    marginLeft: 16,
                    marginRight: 16,
                    marginBottom: 16,
                    paddingTop: 14,
                    paddingBottom: 14,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 16 }}>Choisir</Text>
                </WebButton>
              )}
            </View>
          );
        })}

        {/* Cancel Button */}
        {currentTier !== 'essentiel' && !subscriptionInfo?.cancel_at_period_end && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={[typography.labelMedium, { color: theme.error }]}>Résilier mon abonnement</Text>
          </TouchableOpacity>
        )}

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: theme.infoSoft || theme.primarySoft }]}>
          <Ionicons name="information-circle" size={20} color={theme.info || theme.primary} />
          <Text style={[typography.tiny, { color: theme.info || theme.primary, flex: 1, marginLeft: spacing.sm }]}>
            Les prélèvements sont automatiques chaque mois. Vous pouvez résilier à tout moment, l'abonnement reste actif jusqu'à la fin de la période payée.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.xl, paddingBottom: 40 },
  // Club styles
  clubCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 2,
    marginBottom: spacing.lg,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  clubBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clubFeatures: {
    marginBottom: spacing.md,
  },
  clubFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clubPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  soldOutBadge: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xl,
  },
  // Original styles
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  planCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuresContainer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  selectBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
});
