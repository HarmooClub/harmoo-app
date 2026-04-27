import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

export default function ContestCandidatesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await api.get('/contest/candidates');
      setCandidates(res.data.candidates || []);
      setTotal(res.data.total || 0);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderCandidate = ({ item }: { item: any }) => (
    <View style={[styles.candidateCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 16 }}>
          {item.full_name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[typography.labelMedium, { color: theme.title }]}>{item.full_name}</Text>
        <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>{item.email}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {item.categories?.map((cat: string, i: number) => (
            <View key={i} style={[styles.catBadge, { backgroundColor: theme.primarySoft }]}>
              <Text style={{ fontSize: 11, color: theme.primary }}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
        <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600' }}>En attente</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.title }]}>Concours du Cercle</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={[styles.statsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={[typography.h2, { color: '#DC1B78' }]}>{total}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Candidatures</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={[typography.h2, { color: theme.primary }]}>Liste d'attente</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>10 - 17 mai</Text>
        </View>
      </View>

      {/* Candidates list */}
      <FlatList
        data={candidates}
        renderItem={renderCandidate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md }]}>
              Aucune candidature pour le moment
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  statsCard: { flexDirection: 'row', marginHorizontal: spacing.lg, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, marginHorizontal: spacing.md },
  candidateCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.sm },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
});
