import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { dashboardApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card } from '../src/components/Card';
import { spacing, typography, radius } from '../src/theme';

export default function DashboardScreen() {
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const statItems = [
    { label: 'Revenus', value: `${stats?.total_revenue || 0}€`, icon: 'cash-outline', color: '#DC1B78' },
    { label: 'Réservations', value: `${stats?.total_bookings || 0}`, icon: 'calendar-outline', color: '#3B82F6' },
    { label: 'Avis', value: `${stats?.total_reviews || 0}`, icon: 'star-outline', color: '#F59E0B' },
    { label: 'Note', value: stats?.average_rating?.toFixed(1) || '0.0', icon: 'trending-up-outline', color: '#10B981' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Tableau de bord" />

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.statsGrid}>
            {statItems.map((item, i) => (
              <Card key={i} style={styles.statCard} padding={spacing.lg}>
                <View style={[styles.statIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[typography.displaySmall, { color: item.color, marginTop: spacing.md }]}>{item.value}</Text>
                <Text style={[typography.caption, { color: theme.textSecondary, marginTop: spacing.xs }]}>{item.label}</Text>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.xl, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: '47%', alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
