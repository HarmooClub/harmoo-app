import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { subscriptionsApi } from '../src/services/api';
import { spacing, typography } from '../src/theme';

export default function SubscriptionCheckoutScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { tier } = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tier) {
      initiateCheckout();
    }
  }, [tier]);

  const initiateCheckout = async () => {
    try {
      const originUrl = Platform.OS === 'web' 
        ? window.location.origin 
        : 'https://harmooclub.com';

      const response = await subscriptionsApi.createCheckout(tier as string, originUrl);
      
      if (response.data.status === 'free') {
        router.replace('/subscription-success?status=free');
        return;
      }
      
      if (response.data.checkout_url) {
        if (Platform.OS === 'web') {
          const url = response.data.checkout_url;
          try {
            window.location.replace(url);
          } catch {
            window.location.href = url;
          }
        } else {
          await Linking.openURL(response.data.checkout_url);
          router.back();
        }
      } else {
        setError('URL de paiement non reçue');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du paiement');
    }
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Text style={[typography.h2, { color: theme.error, textAlign: 'center' }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.lg, textAlign: 'center' }]}>
          Redirection vers le paiement...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
