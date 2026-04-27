import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radius, typography } from '../src/theme';
import api from '../src/services/api';

export default function ContestScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/contest/status');
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/contest/submit');
      Alert.alert('Bravo !', res.data.message);
      fetchStatus();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.title }]}>Concours du Cercle</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Contest info */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.iconWrapper}>
            <Ionicons name="trophy" size={48} color="#DC1B78" />
          </View>
          <Text style={[typography.h3, { color: theme.title, textAlign: 'center', marginTop: spacing.md }]}>
            1er Concours du Cercle
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 }]}>
            Transforme tes idées en projet concret en 3 semaines avec une équipe motivée et compétente.
          </Text>
          
          <View style={[styles.dateBadge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="calendar-outline" size={16} color={theme.primary} />
            <Text style={[typography.labelMedium, { color: theme.primary, marginLeft: 6 }]}>
              Du 10 mai au 17 mai 2025
            </Text>
          </View>
        </View>

        {/* Status */}
        {status?.submitted ? (
          <View style={[styles.statusCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[typography.labelMedium, { color: '#10B981' }]}>Candidature soumise !</Text>
              <Text style={[typography.bodySmall, { color: '#059669', marginTop: 4 }]}>
                Vous êtes sur la liste d'attente. Nous vous recontacterons bientôt.
              </Text>
            </View>
          </View>
        ) : status?.contest_open ? (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: '#DC1B78' }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={[typography.labelMedium, { color: '#fff', marginLeft: 8 }]}>Soumettre mon profil</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.statusCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[typography.labelMedium, { color: '#92400E' }]}>Candidatures pas encore ouvertes</Text>
              <Text style={[typography.bodySmall, { color: '#A16207', marginTop: 4 }]}>
                Les inscriptions ouvrent le 10 mai à 00h00.
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  card: { borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, alignItems: 'center' },
  iconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(220,27,120,0.08)', justifyContent: 'center', alignItems: 'center' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: spacing.lg },
  statusCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xl },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: radius.lg, marginTop: spacing.xl },
});
