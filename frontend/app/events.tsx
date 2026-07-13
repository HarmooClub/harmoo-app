import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';
import { eventsApi } from '../src/services/api';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

interface Event {
  id: string;
  title: string;
  date?: string;
  shotgun_url?: string;
  image_url?: string;
}

export default function EventsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [shotgunUrl, setShotgunUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
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
      setTitle('');
      setDate('');
      setShotgunUrl('');
      setImageUrl('');
    }
    setShowModal(true);
  };

  const saveEvent = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

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
      Alert.alert('Succès', editingEvent ? 'Événement mis à jour' : 'Événement créé');
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  };

  const deleteEvent = async (event: Event) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${event.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventsApi.delete(event.id);
              setEvents(events.filter(e => e.id !== event.id));
            } catch (e: any) {
              Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Événements</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={() => openModal()}>
            <Ionicons name="add-circle" size={28} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: theme.border }]}>
            <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md, textAlign: 'center' }]}>
              Aucun événement pour le moment
            </Text>
            {isAdmin && (
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={() => openModal()}>
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '600', marginLeft: 6 }}>Ajouter un événement</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          events.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => event.shotgun_url && Linking.openURL(event.shotgun_url)}
              activeOpacity={event.shotgun_url ? 0.8 : 1}
            >
              {event.image_url ? (
                <Image source={{ uri: event.image_url }} style={styles.eventImage} contentFit="cover" />
              ) : (
                <View style={[styles.eventImage, { backgroundColor: theme.primarySoft, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="calendar" size={40} color={theme.primary} />
                </View>
              )}
              <View style={styles.eventInfo}>
                <Text style={[typography.h3, { color: theme.title }]}>{event.title}</Text>
                {event.date && <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>{event.date}</Text>}
                {event.shotgun_url ? (
                  <View style={[styles.shotgunBadge, { backgroundColor: '#FF5733' }]}>
                    <Text style={[typography.caption, { color: '#FFF', fontWeight: '600' }]}>🎟 Voir sur Shotgun</Text>
                  </View>
                ) : (
                  <View style={[styles.shotgunBadge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[typography.caption, { color: theme.primary, fontWeight: '600' }]}>Bientôt disponible</Text>
                  </View>
                )}
                
                {/* Admin actions */}
                {isAdmin && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity style={[styles.adminBtn, { backgroundColor: theme.background }]} onPress={() => openModal(event)}>
                      <Ionicons name="pencil" size={16} color={theme.primary} />
                      <Text style={{ color: theme.primary, marginLeft: 4, fontSize: 12 }}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.adminBtn, { backgroundColor: 'rgba(255,0,0,0.1)' }]} onPress={() => deleteEvent(event)}>
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                      <Text style={{ color: '#FF3B30', marginLeft: 4, fontSize: 12 }}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Event Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h3, { color: theme.title }]}>{editingEvent ? 'Modifier' : 'Nouvel'} événement</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.title} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Titre *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Nom de l'événement"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={date}
                onChangeText={setDate}
                placeholder="Ex: Samedi 15 Février 2025"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Lien Shotgun</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={shotgunUrl}
                onChangeText={setShotgunUrl}
                placeholder="https://shotgun.live/..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>Image URL (optionnel)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="https://..."
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.background }]} onPress={() => setShowModal(false)}>
                <Text style={[typography.labelMedium, { color: theme.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={saveEvent} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[typography.labelMedium, { color: '#FFF' }]}>Enregistrer</Text>}
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
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, marginTop: spacing.xl },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: spacing.lg },
  eventCard: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  eventImage: { height: 160 },
  eventInfo: { padding: spacing.lg },
  shotgunBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: spacing.sm },
  adminActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginTop: spacing.md, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16 },
  modalButtons: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});
