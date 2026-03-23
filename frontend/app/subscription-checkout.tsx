import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { subscriptionsApi } from '../src/services/api';
import { spacing, typography } from '../src/theme';

export default function SubscriptionCheckoutScreen() {
  const { tier } = useLocalSearchParams<{ tier: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tier && user) {
      startCheckout();
    }
  }, [tier, user]);

  const startCheckout = async () => {
    try {
      const originUrl = Platform.OS === 'web'
        ? window.location.origin
        : process.env.EXPO_PUBLIC_BACKEND_URL || '';

      const response = await subscriptionsApi.createCheckout(tier!, originUrl);

      if (response.data.status === 'free') {
        router.replace('/(tabs)/profile');
      } else if (response.data.url) {
        if (Platform.OS === 'web') {
          window.location.href = response.data.url;
        } else {
          await Linking.openURL(response.data.url);
          router.back();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur');
    }
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[typography.h3, { color: theme.error }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[typography.h3, { color: theme.title, marginTop: spacing.xl }]}>
        Redirection vers le paiement...
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
