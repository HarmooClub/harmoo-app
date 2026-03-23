import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card } from '../src/components/Card';
import { Badge } from '../src/components/Badge';
import { spacing, typography, radius } from '../src/theme';

const PLANS = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price: 'Gratuit',
    commission: '15%',
    features: ['1 service', 'Commission 15% par vente', 'Versement mensuel', 'Accès au tableau de bord'],
    color: '#6B7280',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '2,99\u20ac/mois',
    commission: '6%',
    features: ['2 services', 'Commission 6% par vente', 'Versement tous les 15 jours', 'Support téléphonique 7/7', 'Accès au tableau de bord'],
    color: '#3B82F6',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '7,99\u20ac/mois',
    commission: '0%',
    features: ['3 services', '0% commission', 'Versement instantané', 'Support téléphonique 7/7', 'Accès au tableau de bord'],
    color: '#8B5CF6',
  },
];

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const currentPlan = user?.subscription_tier || 'essentiel';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Abonnement" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Card key={plan.id} style={[
              styles.planCard,
              { borderColor: isCurrent ? plan.color : theme.border, borderWidth: isCurrent ? 2 : 1 },
            ]} padding={spacing.xl}>
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularText}>Populaire</Text>
                </View>
              )}
              <Text style={[typography.h2, { color: theme.title }]}>{plan.name}</Text>
              <Text style={[typography.displaySmall, { color: plan.color, marginTop: spacing.sm }]}>{plan.price}</Text>
              <View style={[styles.commissionBadge, { backgroundColor: plan.color + '15' }]}>
                <Text style={[typography.labelMedium, { color: plan.color }]}>Commission : {plan.commission}</Text>
              </View>

              <View style={{ marginTop: spacing.lg }}>
                {plan.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={plan.color} />
                    <Text style={[typography.bodySmall, { color: theme.title }]}>{f}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.planBtn,
                  isCurrent
                    ? { backgroundColor: plan.color + '15', borderColor: plan.color, borderWidth: 1.5 }
                    : { backgroundColor: plan.color },
                ]}
              >
                <Text style={[typography.labelLarge, { color: isCurrent ? plan.color : '#FFF' }]}>
                  {isCurrent ? 'Plan actuel' : 'Choisir'}
                </Text>
              </TouchableOpacity>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  planCard: { marginBottom: spacing.lg, overflow: 'hidden' },
  popularBadge: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.xs,
  },
  popularText: { color: '#FFF', ...typography.tiny },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 10 },
  planBtn: { alignItems: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  commissionBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.sm, alignSelf: 'flex-start', marginTop: spacing.sm },
});
