import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { subscriptionsApi } from '../src/services/api';
import { Button } from '../src/components/Button';
import { spacing, typography } from '../src/theme';

export default function SubscriptionSuccessScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [tier, setTier] = useState<string>('');

  useEffect(() => {
    if (session_id && user) {
      verifySubscription();
    }
  }, [session_id, user]);

  const verifySubscription = async () => {
    if (!session_id) return;
    
    try {
      const response = await subscriptionsApi.verify(session_id);
      
      if (response.data.status === 'active') {
        setTier(response.data.tier);
        setStatus('success');
        await refreshUser?.();
      } else {
        // Poll again
        setTimeout(verifySubscription, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
    }
  };

  const getTierName = (t: string) => {
    switch (t) {
      case 'business': return 'Business';
      case 'standard': return 'Standard';
      default: return 'Essentiel';
    }
  };

  const getTierColor = (t: string) => {
    switch (t) {
      case 'business': return '#10B981';
      case 'standard': return '#DC1B78';
      default: return '#6B7280';
    }
  };

  if (status === 'checking') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.h3, { color: theme.title, marginTop: spacing.xl }]}>
            Activation de votre abonnement...
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
          <Text style={[typography.h2, { color: theme.title, marginTop: spacing.xxl }]}>
            Erreur d'activation
          </Text>
          <Button title="Réessayer" onPress={() => router.replace('/membership')} style={{ marginTop: spacing.xxl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.center}>
        <View style={[styles.iconContainer, { backgroundColor: getTierColor(tier) + '20' }]}>
          <Ionicons name="checkmark-circle" size={64} color={getTierColor(tier)} />
        </View>
        
        <Text style={[typography.displaySmall, { color: theme.title, marginTop: spacing.xxl }]}>
          Bienvenue !
        </Text>
        
        <Text style={[typography.h3, { color: getTierColor(tier), marginTop: spacing.md }]}>
          Formule {getTierName(tier)} activée
        </Text>
        
        <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
          Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités !
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button title="Retour au profil" onPress={() => router.replace('/(tabs)/profile')} />
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
  buttonContainer: {
    width: '100%',
    marginTop: spacing.xxxl,
  },
});
