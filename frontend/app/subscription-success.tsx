import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Button } from '../src/components/Button';
import { subscriptionsApi } from '../src/services/api';
import { spacing, typography } from '../src/theme';

export default function SubscriptionSuccessScreen() {
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const { session_id, status } = useLocalSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'free') {
      setSuccess(true);
      setIsVerifying(false);
      refreshUser();
    } else if (session_id) {
      verifyPayment();
    }
  }, [session_id, status]);

  const verifyPayment = async () => {
    try {
      const response = await subscriptionsApi.verify(session_id as string);
      if (response.data.status === 'active') {
        setSuccess(true);
        await refreshUser();
      }
    } catch (error) {
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.lg }]}>
            Vérification du paiement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {success ? (
          <>
            <View style={[styles.iconContainer, { backgroundColor: theme.success }]}>
              <Ionicons name="checkmark" size={48} color="#fff" />
            </View>
            <Text style={[typography.h1, { color: theme.title, marginTop: spacing.xl, textAlign: 'center' }]}>
              Abonnement activé !
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Votre abonnement est maintenant actif. Profitez de vos nouveaux avantages !
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.iconContainer, { backgroundColor: theme.error }]}>
              <Ionicons name="close" size={48} color="#fff" />
            </View>
            <Text style={[typography.h2, { color: theme.error, marginTop: spacing.xl, textAlign: 'center' }]}>
              Paiement non vérifié
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Si vous avez été débité, contactez-nous.
            </Text>
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button title="Retour à l'accueil" onPress={() => router.replace('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: spacing.xl * 2,
    width: '100%',
  },
});
