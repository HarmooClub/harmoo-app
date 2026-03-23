import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Button } from '../src/components/Button';
import api from '../src/services/api';
import { spacing, typography, radius } from '../src/theme';

export default function ClubSuccessScreen() {
  const { theme } = useTheme();
  const { refreshUser } = useAuth();
  const router = useRouter();
  const { session_id } = useLocalSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (session_id) {
      verifyPayment();
    }
  }, [session_id]);

  const verifyPayment = async () => {
    try {
      const response = await api.get(`/club/verify/${session_id}`);
      if (response.data.status === 'success') {
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
          <ActivityIndicator size="large" color="#FFD700" />
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
            <View style={[styles.iconContainer, { backgroundColor: '#FFD700' }]}>
              <Ionicons name="star" size={48} color="#1a1a2e" />
            </View>
            <Text style={[typography.h1, { color: '#FFD700', marginTop: spacing.xl, textAlign: 'center' }]}>
              Bienvenue au Club !
            </Text>
            <Text style={[typography.bodyMedium, { color: theme.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Vous êtes maintenant membre du Harmoo Club. Profitez de vos avantages exclusifs !
            </Text>
            
            <View style={styles.benefits}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                <Text style={[typography.bodyMedium, { color: theme.text, marginLeft: spacing.sm }]}>Badge "Club" sur votre profil</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                <Text style={[typography.bodyMedium, { color: theme.text, marginLeft: spacing.sm }]}>Accès aux événements exclusifs</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                <Text style={[typography.bodyMedium, { color: theme.text, marginLeft: spacing.sm }]}>Réductions sur les prestations</Text>
              </View>
            </View>
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
  benefits: {
    marginTop: spacing.xl,
    width: '100%',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginTop: spacing.xl * 2,
    width: '100%',
  },
});
