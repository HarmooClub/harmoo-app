import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { paymentsApi } from '../src/services/api';
import { Button } from '../src/components/Button';
import { spacing, typography } from '../src/theme';

export default function PaymentSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (session_id && user) {
      checkPaymentStatus();
    }
  }, [session_id, user]);

  const checkPaymentStatus = async () => {
    if (!session_id) return;
    
    try {
      const response = await paymentsApi.getStripeStatus(session_id);
      setPaymentInfo(response.data);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else if (attempts < 5) {
        // Poll again after 2 seconds
        setTimeout(() => {
          setAttempts(prev => prev + 1);
          checkPaymentStatus();
        }, 2000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Payment status error:', error);
      if (attempts < 5) {
        setTimeout(() => {
          setAttempts(prev => prev + 1);
          checkPaymentStatus();
        }, 2000);
      } else {
        setStatus('error');
      }
    }
  };

  if (status === 'checking') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.h3, { color: theme.title, marginTop: spacing.xl }]}>
            Vérification du paiement...
          </Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.sm }]}>
            Veuillez patienter
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <View style={[styles.iconContainer, { backgroundColor: theme.errorSoft }]}>
            <Ionicons name="close-circle" size={64} color={theme.error} />
          </View>
          <Text style={[typography.h2, { color: theme.title, marginTop: spacing.xxl, textAlign: 'center' }]}>
            Erreur de paiement
          </Text>
          <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>
            Nous n'avons pas pu confirmer votre paiement.
          </Text>
          <View style={styles.buttonContainer}>
            <Button title="Réessayer" onPress={() => router.back()} />
            <Button title="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} variant="outline" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <View style={[styles.iconContainer, { backgroundColor: theme.successSoft }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.success} />
        </View>
        
        <Text style={[typography.displaySmall, { color: theme.title, marginTop: spacing.xxl, textAlign: 'center' }]}>
          Paiement réussi !
        </Text>
        
        <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.md, textAlign: 'center' }]}>
          Votre réservation a été confirmée et le prestataire a été notifié.
        </Text>
        
        {paymentInfo && (
          <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Montant payé</Text>
              <Text style={[typography.h3, { color: theme.primary }]}>
                {paymentInfo.amount}€
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button title="Voir mes réservations" onPress={() => router.replace('/(tabs)/bookings')} />
          <Button title="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} variant="outline" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.xxl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
});
