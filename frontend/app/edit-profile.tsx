import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { spacing, radius, typography } from '../src/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [organization, setOrganization] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setOrganization(user.organization || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    setSaving(true);
    try {
      await updateUser({
        full_name: fullName.trim(),
        location: location.trim() || undefined,
        bio: bio.trim() || undefined,
        organization: organization.trim() || undefined,
      } as any);
      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de sauvegarder');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.title} />
          </TouchableOpacity>
          <Text style={[typography.h2, { color: theme.title }]}>Modifier le profil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Nom complet *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Votre nom"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Localisation</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: Paris, France"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Organization */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Organisation / Entreprise</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
              value={organization}
              onChangeText={setOrganization}
              placeholder="Ex: Harmoo Club"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Bio / Description</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Décrivez-vous en quelques mots..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[typography.labelLarge, { color: '#FFF' }]}>Enregistrer</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 16, minHeight: 120 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 16, borderRadius: radius.lg, alignItems: 'center' },
});
