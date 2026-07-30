import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, shadows } from '../src/theme';
import { eventsApi } from '../src/services/api';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

interface Event {
  id: string;
  title: string;
  date?: string;
  shotgun_url?: string;
  image_url?: string;
}

// Memoized event card
const EventCard = memo(({ event, isAdmin, onPress, onEdit, onDelete, theme }: any) => (
  <TouchableOpacity
    style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    onPress={onPress}
    activeOpacity={event.shotgun_url ? 0.8 : 1}
  >
    {event.image_url ? (
      <Image source={{ uri: event.image_url }} style={styles.eventImage} contentFit="cover" cachePolicy="memory-disk" />
    ) : (
      <View style={[styles.eventImage, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.eventIconLarge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
          <Ionicons name="calendar-outline" size={32} color="#3B82F6" />
        </View>
      </View>
    )}
    <View style={styles.eventInfo}>
      <Text style={[styles.eventTitle, { color: theme.title }]}>{event.title}</Text>
      {event.date && <Text style={[styles.eventDate, { color: theme.textSecondary }]}>{event.date}</Text>}
      {event.shotgun_url ? (
        <View style={styles.shotgunBadge}>
          <Text style={styles.shotgunText}>🎟 Voir sur Shotgun</Text>
        </View>
      ) : (
        <View style={[styles.comingSoonBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
          <Text style={[styles.comingSoonText, { color: '#3B82F6' }]}>Bientôt disponible</Text>
        </View>
      )}
      {isAdmin && (
        <View style={styles.adminActions}>
          <TouchableOpacity style={[styles.adminBtn, { backgroundColor: theme.border }]} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={14} color={theme.title} />
            <Text style={[styles.adminBtnText, { color: theme.title }]}>Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.adminBtn, { backgroundColor: 'rgba(239,68,68,0.15)' }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
            <Text style={[styles.adminBtnText, { color: '#EF4444' }]}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  </TouchableOpacity>
));

export default function EventsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [shotgunUrl, setShotgunUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    try {
      const res = await eventsApi.getAll();
      setEvents(res.data || []);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); }
  };

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setTitle(event.title);
      setDate(event.date || '');
      setShotgunUrl(event.shotgun_url || '');
      setImageUrl(event.image_url || '');
    } else {
      setEditingEvent(null);
      setTitle(''); setDate(''); setShotgunUrl(''); setImageUrl('');
    }
    setShowModal(true);
  };

  const saveEvent = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    setSaving(true);
    try {
      if (editingEvent) {
        const res = await eventsApi.update(editingEvent.id, { title, date, shotgun_url: shotgunUrl, image_url: imageUrl });
        setEvents(events.map(e => e.id === editingEvent.id ? res.data : e));
      } else {
        const res = await eventsApi.create({ title, date, shotgun_url: shotgunUrl, image_url: imageUrl });
        setEvents([res.data, ...events]);
      }
      setShowModal(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  };

  const deleteEvent = (event: Event) => {
    Alert.alert('Supprimer', `Supprimer "${event.title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await eventsApi.delete(event.id);
          setEvents(events.filter(e => e.id !== event.id));
        } catch (e: any) { Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de supprimer'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={styles.headerTitle}>Événements</Text>
        {isAdmin ? (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.card }]} onPress={() => openModal()}>
            <Ionicons name="add" size={22} color={theme.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 28 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="calendar-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucun événement pour le moment</Text>
            {isAdmin && (
              <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()}>
                <Text style={styles.emptyBtnText}>Ajouter un événement</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              theme={theme}
              onPress={() => event.shotgun_url && Linking.openURL(event.shotgun_url)}
              onEdit={() => openModal(event)}
              onDelete={() => deleteEvent(event)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.title }]}>{editingEvent ? 'Modifier' : 'Nouvel'} événement</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.title} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Titre *</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]} value={title} onChangeText={setTitle} placeholder="Nom de l'événement" placeholderTextColor={theme.textSecondary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]} value={date} onChangeText={setDate} placeholder="Ex: Samedi 15 Février 2025" placeholderTextColor={theme.textSecondary} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Lien Shotgun</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]} value={shotgunUrl} onChangeText={setShotgunUrl} placeholder="https://shotgun.live/..." placeholderTextColor={theme.textSecondary} autoCapitalize="none" />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Image URL</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." placeholderTextColor={theme.textSecondary} autoCapitalize="none" />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setShowModal(false)}>
                <Text style={[styles.modalBtnText, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={saveEvent} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.modalBtnText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', ...shadows.sm },
  content: { padding: spacing.lg, paddingBottom: 40 },
  emptyState: { alignItems: 'center', padding: spacing.xxl, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, marginTop: spacing.xl },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyText: { fontSize: 15, textAlign: 'center' },
  emptyBtn: { backgroundColor: '#DC1B78', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: spacing.lg, ...shadows.glow },
  emptyBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  eventCard: { borderRadius: 16, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden', ...shadows.md },
  eventImage: { height: 160 },
  eventIconLarge: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { padding: spacing.lg },
  eventTitle: { fontSize: 18, fontWeight: '700' },
  eventDate: { fontSize: 13, marginTop: 4 },
  shotgunBadge: { alignSelf: 'flex-start', backgroundColor: '#FF5733', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: spacing.sm },
  shotgunText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  comingSoonBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: spacing.sm },
  comingSoonText: { fontSize: 12, fontWeight: '600' },
  adminActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  adminBtnText: { fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, ...shadows.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '600', marginTop: spacing.md, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.md, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
