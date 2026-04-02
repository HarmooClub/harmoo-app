import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { servicesApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card } from '../src/components/Card';
import { Badge } from '../src/components/Badge';
import { spacing, typography, radius } from '../src/theme';

export default function MyServicesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    try {
      const res = await servicesApi.getMyServices();
      setServices(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, []);

  const handleDelete = (id: string) => {
    const doDelete = async () => {
      try {
        await servicesApi.deleteService(id);
        setServices(prev => prev.filter(s => s.id !== id));
      } catch (e) { Alert.alert('Erreur', 'Impossible de supprimer'); }
    };
    if (Platform.OS === 'web') { if (window.confirm('Supprimer ce service ?')) doDelete(); }
    else { Alert.alert('Supprimer', 'Supprimer ce service ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: doDelete }]); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader
        title="Mes services"
        rightAction={
          <TouchableOpacity onPress={() => router.push('/add-service')} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={isLoading ? [] : services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        renderItem={({ item }) => (
          <Card style={styles.card} padding={spacing.lg}>
            <View style={styles.cardHeader}>
              <Badge label={item.category || 'Service'} variant="primary" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/add-service', params: { editId: item.id, editData: JSON.stringify(item) } })}>
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Ionicons name="trash-outline" size={18} color={theme.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[typography.h4, { color: theme.title, marginTop: spacing.md }]}>{item.title}</Text>
            {item.description ? (
              <Text style={[typography.caption, { color: theme.text, marginTop: spacing.xs }]} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
              <Text style={[typography.h2, { color: theme.primary }]}>{item.price}€</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{Math.round(item.duration_hours * 60)} min</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Aucun service</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Créez votre premier service</Text>
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/add-service')}>
                <Text style={[typography.labelLarge, { color: '#FFF' }]}>Créer un service</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deleteBtn: { padding: spacing.xs },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1,
  },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  createBtn: { marginTop: spacing.xl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.lg },
});
