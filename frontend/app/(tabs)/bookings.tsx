import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Platform, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { bookingsApi } from '../../src/services/api';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { spacing, typography, radius } from '../../src/theme';

const STATUS_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmée' },
  { id: 'completed', label: 'Terminée' },
  { id: 'cancelled', label: 'Annulée' },
];

const STATUS_MAP: Record<string, { color: string; icon: string; label: string; variant: any }> = {
  pending: { color: '#F59E0B', icon: 'time-outline', label: 'En attente', variant: 'warning' },
  confirmed: { color: '#10B981', icon: 'checkmark-circle-outline', label: 'Confirmée', variant: 'success' },
  completed: { color: '#3B82F6', icon: 'ribbon-outline', label: 'Terminée', variant: 'info' },
  cancelled: { color: '#EF4444', icon: 'close-circle-outline', label: 'Annulée', variant: 'error' },
};

export default function BookingsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { loadBookings(); }, []);
  
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === selectedFilter));
    }
  }, [selectedFilter, bookings]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      const res = await bookingsApi.getMyBookings();
      setBookings(res.data);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, []);

  const handleCancel = (booking: any) => {
    const doCancel = async () => {
      try {
        await bookingsApi.cancelBooking(booking.id);
        await loadBookings();
      } catch (error: any) {
        const msg = error.response?.data?.detail || 'Erreur lors de l\'annulation';
        Alert.alert('Erreur', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous annuler cette réservation ?')) doCancel();
    } else {
      Alert.alert('Annuler', 'Voulez-vous vraiment annuler ?', [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  const handleEdit = (booking: any) => {
    setEditingBooking(booking);
    setEditNotes(booking.notes || '');
    setEditDate(booking.date ? new Date(booking.date).toISOString().split('T')[0] : '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    setIsSaving(true);
    try {
      const update: any = {};
      if (editNotes !== (editingBooking.notes || '')) update.notes = editNotes;
      if (editDate) {
        const newDate = new Date(editDate + 'T10:00:00Z').toISOString();
        if (newDate !== editingBooking.date) update.date = newDate;
      }
      if (Object.keys(update).length > 0) {
        await bookingsApi.updateBooking(editingBooking.id, update);
        await loadBookings();
      }
      setEditModalVisible(false);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderBookingCard = ({ item }: { item: any }) => {
    const status = STATUS_MAP[item.status] || STATUS_MAP.pending;
    const isPending = item.status === 'pending';
    const isClient = item.client_id === user?.id;

    return (
      <Card style={styles.card}>
        <View style={[styles.statusBar, { backgroundColor: status.color + '10' }]}>
          <Badge label={status.label} variant={status.variant} icon={status.icon as any} size="medium" />
          <Text style={[typography.caption, { color: theme.text }]}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardRow}>
            <View style={[styles.cardAvatar, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: theme.title }]}>
                {item.other_party?.full_name || 'Utilisateur'}
              </Text>
              <Text style={[typography.caption, { color: theme.text, marginTop: 2 }]}>
                {item.service?.title || 'Service'}
              </Text>
            </View>
            <Text style={[typography.h2, { color: theme.primary }]}>
              {item.total_price?.toFixed(0)}€
            </Text>
          </View>

          {item.notes ? (
            <View style={[styles.notesRow, { backgroundColor: theme.background }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.textSecondary} />
              <Text style={[typography.caption, { color: theme.text, flex: 1 }]} numberOfLines={2}>{item.notes}</Text>
            </View>
          ) : null}

          {isPending && isClient && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.secondary }]} onPress={() => handleEdit(item)}>
                <Ionicons name="create-outline" size={16} color={theme.secondary} />
                <Text style={[typography.labelMedium, { color: theme.secondary }]}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { borderColor: theme.error }]} onPress={() => handleCancel(item)}>
                <Ionicons name="close-circle-outline" size={16} color={theme.error} />
                <Text style={[typography.labelMedium, { color: theme.error }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

          {isPending && !isClient && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { flex: 1, borderColor: theme.success, backgroundColor: theme.successSoft }]}
                onPress={async () => {
                  try {
                    await bookingsApi.updateStatus(item.id, 'confirmed');
                    await loadBookings();
                  } catch (e) {}
                }}
              >
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={[typography.labelMedium, { color: theme.success }]}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.title }]}>Réservations</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContainer}>
        {STATUS_FILTERS.map((item) => {
          const isActive = selectedFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.card,
                  borderColor: isActive ? theme.primary : theme.border,
                },
              ]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Text style={[typography.labelMedium, { color: isActive ? '#FFF' : theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={isLoading ? [] : filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={56} color={theme.textSecondary} />
              <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Aucune réservation</Text>
              <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>
                {selectedFilter !== 'all' ? 'Aucune réservation avec ce filtre' : 'Réservez un service pour commencer'}
              </Text>
            </View>
          )
        }
      />

      <Modal visible={editModalVisible} animationType="slide" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.glassOverlay}>
          {/* Soft gradient backdrop — no hard edges */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </TouchableOpacity>

          {/* Modal content with glass effect */}
          <View style={styles.glassModalContainer} pointerEvents="box-none">
            {/* Top feather gradient — creates the soft fade-in effect */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.9)']}
              locations={[0, 0.4, 1]}
              style={styles.glassFeatherTop}
              pointerEvents="none"
            />

            {Platform.OS !== 'web' ? (
              <BlurView intensity={50} tint="light" style={styles.glassSheet}>
                <View style={[styles.glassSheetInner, { backgroundColor: 'rgba(255,255,255,0.88)' }]}>
                  <View style={styles.glassModalHeader}>
                    <Text style={[typography.h2, { color: theme.title }]}>Modifier</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                      <Ionicons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalBody}>
                    <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm }]}>Date (AAAA-MM-JJ)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                      value={editDate}
                      onChangeText={setEditDate}
                      placeholder="2026-04-15"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                      value={editNotes}
                      onChangeText={setEditNotes}
                      placeholder="Ajouter une note..."
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setEditModalVisible(false)}>
                      <Text style={[typography.labelLarge, { color: theme.text }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[typography.labelLarge, { color: '#FFF' }]}>Sauvegarder</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            ) : (
              <View style={styles.glassSheetWeb}>
                <View style={[styles.glassSheetInner, { backgroundColor: 'rgba(255,255,255,0.92)' }]}>
                  <View style={styles.glassModalHeader}>
                    <Text style={[typography.h2, { color: theme.title }]}>Modifier</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                      <Ionicons name="close" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.modalBody}>
                    <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm }]}>Date (AAAA-MM-JJ)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                      value={editDate}
                      onChangeText={setEditDate}
                      placeholder="2026-04-15"
                      placeholderTextColor={theme.textSecondary}
                    />
                    <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.lg, marginBottom: spacing.sm }]}>Notes</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                      value={editNotes}
                      onChangeText={setEditNotes}
                      placeholder="Ajouter une note..."
                      placeholderTextColor={theme.textSecondary}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setEditModalVisible(false)}>
                      <Text style={[typography.labelLarge, { color: theme.text }]}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={handleSaveEdit} disabled={isSaving}>
                      {isSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[typography.labelLarge, { color: '#FFF' }]}>Sauvegarder</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  filtersRow: { maxHeight: 52, marginBottom: spacing.xs },
  filtersContainer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, gap: spacing.sm },
  filterChip: { paddingHorizontal: spacing.lg, paddingVertical: 9, borderRadius: radius.full, borderWidth: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  statusBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  cardContent: { padding: spacing.lg },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardAvatar: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  notesRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    padding: 10, borderRadius: radius.sm, marginTop: spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5,
  },
  emptyContainer: { paddingVertical: 80, alignItems: 'center' },
  // Glassmorphism modal styles
  glassOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  glassModalContainer: {
    position: 'relative',
  },
  glassFeatherTop: {
    position: 'absolute',
    top: -36,
    left: -12,
    right: -12,
    height: 44,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    zIndex: 5,
  },
  glassSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 32,
  },
  glassSheetWeb: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 32,
    // @ts-ignore — web only
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  },
  glassSheetInner: {
    padding: spacing.xxl,
    paddingBottom: 44,
  },
  glassModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  modalBody: {},
  input: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, ...typography.bodyMedium },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  modalBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, borderRadius: radius.md },
});
