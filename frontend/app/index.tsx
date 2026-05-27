import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();

  // Redirect immediately to the feed — no waiting for auth
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
