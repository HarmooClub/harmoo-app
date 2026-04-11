import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Avatar, getAvatarUrl } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { servicesApi, bookingsApi, paymentsApi, usersApi } from '../../src/services/api';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import Constants from 'expo-constants';

// Commission rates by subscription tier
const COMMISSION_RATES: Record<string, number> = {
  essentiel: 0.15,
  standard: 0.06,
  business: 0.0,
};

const TIER_LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  standard: 'Standard',
  business: 'Business',
};

function getCommissionRate(tier: string): number {
  return COMMISSION_RATES[tier] || COMMISSION_RATES.essentiel;
}

function getTierLabel(tier: string): string {
  return TIER_LABELS[tier] || TIER_LABELS.essentiel;
}

function getTierColor(tier: string, theme: any): string {
  switch (tier) {
    case 'business': return theme.success || '#10B981';
    case 'standard': return theme.primary || '#DC1B78';
    default: return theme.textSecondary || '#6B7280';
  }
}

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [service, setService] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [bookingId, setBookingId] = useState<string | null>(null);

  const availableTimes = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1));

  useEffect(() => {
    if (serviceId) loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      const res = await servicesApi.getService(serviceId as string);
      setService(res.data);
      const freelancerRes = await usersApi.getUser(res.data.freelancer_id);
      setFreelancer(freelancerRes.data);
    } catch (error) {
      console.error('Failed to load service:', error);
      Alert.alert('Erreur', 'Service non trouvé');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    setIsBooking(true);
    try {
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const response = await bookingsApi.createBooking({
        service_id: serviceId as string,
        date: bookingDate.toISOString(),
        notes,
      });
      setBookingId(response.data.id);
      setStep('payment');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de la réservation');
    } finally { setIsBooking(false); }
  };

  const handlePayment = async () => {
    if (!bookingId) {
      Alert.alert('Erreur', 'Réservation non trouvée');
      return;
    }
    
    setIsBooking(true);
    try {
      // Get origin URL for Stripe redirect
      const originUrl = Platform.OS === 'web' 
        ? window.location.origin 
        : process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
      
      // Create Stripe checkout session
      const response = await paymentsApi.createStripeCheckout(bookingId, originUrl);
      
      // Open Stripe checkout
      if (response.data.url) {
        if (Platform.OS === 'web') {
          window.location.href = response.data.url;
        } else {
          await Linking.openURL(response.data.url);
        }
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors du paiement');
    } finally { setIsBooking(false); }
  };

  // ---- Loading ----
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  // ---- Not found ----
  if (!service) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Réserver" />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.textSecondary} />
          <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Service non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Success ----
  if (step === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.successSoft }]}>
            <Ionicons name="checkmark-circle" size={64} color={theme.success} />
          </View>
          <Text style={[typography.displaySmall, { color: theme.title, marginTop: spacing.xxl, textAlign: 'center' }]}>
            Réservation confirmée !
          </Text>
          <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>
            Votre réservation avec {freelancer?.full_name} a été confirmée.
          </Text>
          <Text style={[typography.h3, { color: theme.primary, marginTop: spacing.lg }]}>
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })} à {selectedTime}
          </Text>
          <View style={{ width: '100%', marginTop: spacing.xxxl, gap: spacing.md }}>
            <Button title="Voir mes réservations" onPress={() => router.replace('/(tabs)/bookings')} />
            <Button title="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Main Flow (Details + Payment) ----
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader
        title={step === 'details' ? 'Réserver' : 'Paiement'}
        onBack={() => step === 'payment' ? setStep('details') : router.back()}
      />

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, { backgroundColor: theme.primary }]}>
          <Ionicons name="calendar" size={14} color="#FFF" />
        </View>
        <View style={[styles.stepLine, { backgroundColor: step === 'payment' ? theme.primary : theme.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step === 'payment' ? theme.primary : theme.border }]}>
          <Ionicons name="card" size={14} color={step === 'payment' ? '#FFF' : theme.textSecondary} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {step === 'details' ? (
          <>
            {/* Service Info Card */}
            <Card style={styles.sectionCard} padding={spacing.lg}>
              <Text style={[typography.h2, { color: theme.title }]}>{service.title}</Text>
              {service.description ? (
                <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm, lineHeight: 20 }]}>
                  {service.description}
                </Text>
              ) : null}

              <View style={[styles.detailRow, { borderTopColor: theme.divider }]}>
                <View style={styles.detailChip}>
                  <Ionicons name="cash-outline" size={18} color={theme.primary} />
                  <Text style={[typography.h3, { color: theme.primary }]}>{service.price}€</Text>
                </View>
                <View style={styles.detailChip}>
                  <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                  <Text style={[typography.bodyMedium, { color: theme.text }]}>{service.duration_hours}h</Text>
                </View>
              </View>

              {freelancer && (
                <View style={[styles.freelancerRow, { borderTopColor: theme.divider }]}>
                  <Avatar uri={freelancer.avatar} name={freelancer.full_name} size={36} borderRadius={radius.md} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.h4, { color: theme.title }]}>{freelancer.full_name}</Text>
                    {freelancer.city ? (
                      <Text style={[typography.tiny, { color: theme.textSecondary }]}>{freelancer.city}</Text>
                    ) : null}
                  </View>
                  {freelancer.rating ? (
                    <View style={styles.ratingChip}>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={[typography.captionBold, { color: theme.title }]}>{freelancer.rating.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </Card>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={[typography.h3, { color: theme.title, paddingHorizontal: spacing.xl }]}>Choisir une date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                {availableDates.map((date, index) => {
                  const isSelected = selectedDate.toDateString() === date.toDateString();
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateButton,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.card,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedDate(date)}
                      activeOpacity={0.7}
                    >
                      <Text style={[typography.tiny, { color: isSelected ? '#FFF' : theme.textSecondary, textTransform: 'capitalize' }]}>
                        {format(date, 'EEE', { locale: fr })}
                      </Text>
                      <Text style={[typography.h2, { color: isSelected ? '#FFF' : theme.title, marginTop: spacing.xs }]}>
                        {format(date, 'd')}
                      </Text>
                      <Text style={[typography.tiny, { color: isSelected ? 'rgba(255,255,255,0.7)' : theme.textSecondary, marginTop: 2 }]}>
                        {format(date, 'MMM', { locale: fr })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View style={styles.section}>
              <Text style={[typography.h3, { color: theme.title, paddingHorizontal: spacing.xl, marginBottom: spacing.md }]}>Choisir une heure</Text>
              <View style={styles.timesGrid}>
                {availableTimes.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeButton,
                        {
                          backgroundColor: isSelected ? theme.primary : theme.card,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedTime(time)}
                      activeOpacity={0.7}
                    >
                      <Text style={[typography.labelMedium, { color: isSelected ? '#FFF' : theme.text }]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Input
                label="Notes (optionnel)"
                placeholder="Ajoutez des détails pour le prestataire..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </>
        ) : (
          <>
            {/* Payment Summary */}
            <Card style={styles.sectionCard} padding={spacing.lg}>
              <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>Récapitulatif</Text>
              
              <SummaryRow label="Service" value={service.title} theme={theme} />
              <SummaryRow label="Date" value={format(selectedDate, 'd MMMM yyyy', { locale: fr })} theme={theme} />
              <SummaryRow label="Heure" value={selectedTime} theme={theme} />
              <SummaryRow label="Durée" value={`${service.duration_hours}h`} theme={theme} />

              <View style={[styles.priceBreakdown, { borderTopColor: theme.divider }]}>
                <View style={styles.summaryRow}>
                  <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Prix du service</Text>
                  <Text style={[typography.h4, { color: theme.title }]}>{service.price}€</Text>
                </View>
                
                {/* Commission info */}
                {freelancer && (
                  <View style={styles.summaryRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Commission Harmoo</Text>
                      <View style={[styles.tierBadge, { backgroundColor: getTierColor(freelancer.subscription_tier || 'essentiel', theme) + '20' }]}>
                        <Text style={[typography.tiny, { color: getTierColor(freelancer.subscription_tier || 'essentiel', theme), fontWeight: '600' }]}>
                          {getTierLabel(freelancer.subscription_tier || 'essentiel')}
                        </Text>
                      </View>
                    </View>
                    <Text style={[typography.h4, { color: theme.textSecondary }]}>
                      {getCommissionRate(freelancer.subscription_tier || 'essentiel') === 0 
                        ? 'Offerte' 
                        : `${(service.price * getCommissionRate(freelancer.subscription_tier || 'essentiel')).toFixed(2)}€`}
                    </Text>
                  </View>
                )}
                
                {freelancer && getCommissionRate(freelancer.subscription_tier || 'essentiel') > 0 && (
                  <View style={[styles.commissionNote, { backgroundColor: theme.infoSoft || theme.primarySoft }]}>
                    <Ionicons name="information-circle-outline" size={14} color={theme.info || theme.primary} />
                    <Text style={[typography.tiny, { color: theme.info || theme.primary, flex: 1 }]}>
                      Commission de {(getCommissionRate(freelancer.subscription_tier || 'essentiel') * 100).toFixed(0)}% prélevée sur le prestataire
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.totalRow, { borderTopColor: theme.divider }]}>
                <Text style={[typography.h3, { color: theme.title }]}>Total à payer</Text>
                <Text style={[typography.displaySmall, { color: theme.primary }]}>{service.price}€</Text>
              </View>
              
              {freelancer && (
                <View style={[styles.freelancerEarnings, { backgroundColor: theme.successSoft }]}>
                  <Ionicons name="wallet-outline" size={16} color={theme.success} />
                  <Text style={[typography.caption, { color: theme.success, flex: 1 }]}>
                    Le prestataire recevra {(service.price * (1 - getCommissionRate(freelancer.subscription_tier || 'essentiel'))).toFixed(2)}€
                  </Text>
                </View>
              )}
            </Card>

            {/* Payment Method (Mock) */}
            <Card style={styles.sectionCard} padding={spacing.lg}>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>Mode de paiement</Text>
              
              <TouchableOpacity style={[styles.paymentMethod, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]} activeOpacity={0.7}>
                <View style={[styles.paymentIcon, { backgroundColor: theme.primary }]}>
                  <Ionicons name="card" size={20} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h4, { color: theme.title }]}>Carte bancaire</Text>
                  <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>**** **** **** 4242</Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
              </TouchableOpacity>

              <View style={[styles.mockBanner, { backgroundColor: theme.warningSoft }]}>
                <Ionicons name="information-circle-outline" size={16} color={theme.warning} />
                <Text style={[typography.caption, { color: theme.warning, flex: 1 }]}>
                  Paiement simulé pour la démo
                </Text>
              </View>
            </Card>

            {/* Security badges */}
            <View style={styles.securityRow}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={16} color={theme.success} />
                <Text style={[typography.tiny, { color: theme.textSecondary }]}>Paiement sécurisé</Text>
              </View>
              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={16} color={theme.success} />
                <Text style={[typography.tiny, { color: theme.textSecondary }]}>Données chiffrées</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.divider }]}>
        <View>
          <Text style={[typography.caption, { color: theme.textSecondary }]}>Total</Text>
          <Text style={[typography.displaySmall, { color: theme.primary }]}>{service.price}€</Text>
        </View>
        <Button
          title={step === 'details' ? 'Continuer' : 'Payer maintenant'}
          onPress={step === 'details' ? handleBooking : handlePayment}
          isLoading={isBooking}
          style={{ flex: 1, marginLeft: spacing.xl }}
          icon={step === 'payment' ? <Ionicons name="lock-closed" size={16} color="#FFF" /> : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[typography.h4, { color: theme.title }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.lg,
    gap: 0,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { flex: 1, height: 2, marginHorizontal: spacing.sm },

  content: { paddingBottom: 140 },
  sectionCard: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },

  detailRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  freelancerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  dateScroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
  dateButton: {
    width: 64,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  timesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl },
  timeButton: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1 },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceBreakdown: {
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  commissionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  freelancerEarnings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },

  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  paymentIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
  },

  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
  },
  securityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
  },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
