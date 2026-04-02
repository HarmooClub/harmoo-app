import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { portfolioApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button } from '../src/components/Button';
import { Input } from '../src/components/Input';
import { CATEGORY_NAMES, CATEGORY_ICONS } from '../src/utils/categories';
import { spacing, typography, radius, shadows } from '../src/theme';

export default function AddPortfolioScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string; editData?: string }>();
  const isEdit = !!params.editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (params.editData) {
      try {
        const data = JSON.parse(params.editData);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setSelectedCategories(data.categories || (data.category ? [data.category] : []));
        setImage(data.image || null);
        setYoutubeUrl(data.youtube_url || '');
        setSpotifyUrl(data.spotify_url || '');
        setInstagramUrl(data.instagram_url || '');
        setTiktokUrl(data.tiktok_url || '');
        setExternalUrl(data.external_url || '');
      } catch {}
    }
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setImage(uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { Alert.alert('Erreur', 'Le titre est requis'); return; }
    if (!selectedCategories.length) { Alert.alert('Erreur', 'Choisissez au moins une catégorie'); return; }

    setIsLoading(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        categories: selectedCategories,
      };
      if (image) payload.image = image;
      if (youtubeUrl.trim()) payload.youtube_url = youtubeUrl.trim();
      if (spotifyUrl.trim()) payload.spotify_url = spotifyUrl.trim();
      if (instagramUrl.trim()) payload.instagram_url = instagramUrl.trim();
      if (tiktokUrl.trim()) payload.tiktok_url = tiktokUrl.trim();
      if (externalUrl.trim()) payload.external_url = externalUrl.trim();

      if (isEdit) {
        await portfolioApi.updatePortfolioItem(params.editId!, payload);
        Alert.alert('Succès', 'Projet modifié');
      } else {
        await portfolioApi.addPortfolioItem(payload);
        Alert.alert('Succès', 'Projet ajouté au portfolio');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Impossible d\'ajouter le projet');
    } finally { setIsLoading(false); }
  };

  const allCategories = Object.entries(CATEGORY_NAMES);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader title={isEdit ? "Modifier le projet" : "Ajouter un projet"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Image */}
          <TouchableOpacity style={[styles.imagePicker, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color={theme.textSecondary} />
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                  Ajouter une image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Title & Description */}
          <Input label="Titre du projet" placeholder="Ex: Clip musical pour artiste X" value={title} onChangeText={setTitle} icon="document-text-outline" />
          <Input label="Description" placeholder="Décrivez votre projet..." value={description} onChangeText={setDescription} multiline numberOfLines={3} icon="text-outline" />

          {/* Category selection — multi-select */}
          <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.md }]}>Catégories (plusieurs possibles)</Text>
          <View style={styles.categoryGrid}>
            {allCategories.map(([catId, catName]) => {
              const isSelected = selectedCategories.includes(catId);
              return (
                <TouchableOpacity
                  key={catId}
                  style={[styles.categoryChip, {
                    backgroundColor: isSelected ? theme.primary : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }]}
                  onPress={() => {
                    setSelectedCategories(prev =>
                      prev.includes(catId)
                        ? prev.filter(c => c !== catId)
                        : [...prev, catId]
                    );
                  }}
                >
                  {isSelected && <Ionicons name="checkmark-circle" size={14} color="#FFF" />}
                  <Ionicons
                    name={(CATEGORY_ICONS[catId] || 'grid') as any}
                    size={16}
                    color={isSelected ? '#FFF' : theme.primary}
                  />
                  <Text style={[typography.caption, { color: isSelected ? '#FFF' : theme.title }]} numberOfLines={1}>
                    {catName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Media Links Section */}
          <View style={[styles.linksSection, { borderTopColor: theme.divider }]}>
            <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.md }]}>Liens médias</Text>

            <View style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: '#FF000015' }]}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" />
              </View>
              <TextInput
                style={[styles.linkInput, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
                placeholder="Lien YouTube"
                placeholderTextColor={theme.textSecondary}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: '#1DB95415' }]}>
                <Ionicons name="musical-notes" size={20} color="#1DB954" />
              </View>
              <TextInput
                style={[styles.linkInput, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
                placeholder="Lien Spotify / Deezer"
                placeholderTextColor={theme.textSecondary}
                value={spotifyUrl}
                onChangeText={setSpotifyUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: '#E4405F15' }]}>
                <Ionicons name="logo-instagram" size={20} color="#E4405F" />
              </View>
              <TextInput
                style={[styles.linkInput, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
                placeholder="Lien Instagram"
                placeholderTextColor={theme.textSecondary}
                value={instagramUrl}
                onChangeText={setInstagramUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: '#00000015' }]}>
                <Ionicons name="logo-tiktok" size={20} color="#000000" />
              </View>
              <TextInput
                style={[styles.linkInput, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
                placeholder="Lien TikTok"
                placeholderTextColor={theme.textSecondary}
                value={tiktokUrl}
                onChangeText={setTiktokUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.linkRow}>
              <View style={[styles.linkIcon, { backgroundColor: '#4A90D915' }]}>
                <Ionicons name="link-outline" size={20} color="#4A90D9" />
              </View>
              <TextInput
                style={[styles.linkInput, { backgroundColor: theme.card, color: theme.title, borderColor: theme.border }]}
                placeholder="Lien externe (site web, Behance...)"
                placeholderTextColor={theme.textSecondary}
                value={externalUrl}
                onChangeText={setExternalUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Button title={isEdit ? "Enregistrer" : "Publier le projet"} onPress={handleSubmit} isLoading={isLoading} style={{ marginTop: spacing.xl }} />
          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: 40 },
  imagePicker: {
    height: 200, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: spacing.xl,
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  categoryGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl,
  },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, borderWidth: 1,
  },
  linksSection: {
    borderTopWidth: 1, paddingTop: spacing.xl, marginTop: spacing.md,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md,
  },
  linkIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  linkInput: {
    flex: 1, borderWidth: 1, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    fontSize: 14,
  },
});
