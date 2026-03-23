import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card } from '../src/components/Card';
import { spacing, typography, radius } from '../src/theme';

export default function PersonalInfoScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.divider }]}>
      <Text style={[typography.caption, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[typography.bodyMedium, { color: theme.title, fontWeight: '500' }]}>{value || 'Non renseigné'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Infos personnelles" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card padding={0}>
          <InfoRow label="Nom" value={user?.full_name || ''} />
          <InfoRow label="Email" value={user?.email || ''} />
          <InfoRow label="Ville" value={user?.city || ''} />
          <InfoRow label="Type de compte" value={user?.user_type === 'freelancer' ? 'Artiste-Entrepreneur' : 'Client'} />
          {user?.hourly_rate ? <InfoRow label="Tarif horaire" value={`${user.hourly_rate}€/h`} /> : null}
          {user?.categories?.length ? <InfoRow label="Catégories" value={user.categories.join(', ')} /> : null}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
  },
});
