import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { servicesApi } from '../src/services/api';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { CATEGORY_NAMES, CATEGORY_ICONS } from '../src/utils/categories';
import { spacing, typography, radius } from '../src/theme';

const CATEGORIES = Object.entries(CATEGORY_NAMES).map(([id, name]) => ({ id, name }));

export default function AddServiceScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string; editData?: string }>();
  const isEdit = !!params.editId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (params.editData) {
      try {
        const data = JSON.parse(params.editData);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setPrice(data.price ? String(data.price) : '');
        setDuration(data.duration_hours ? String(Math.round(data.duration_hours * 60)) : '');
      } catch {}
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !price || !duration) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        duration_hours: parseFloat(duration) / 60,
      };
      if (isEdit) {
        await servicesApi.updateService(params.editId!, payload);
        Alert.alert('Succès', 'Service modifié');
      } else {
        await servicesApi.createService(payload);
        Alert.alert('Succès', 'Service créé avec succès');
      }
      router.back();
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Erreur lors de la création';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Créer un service" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          <Input label="Titre du service" value={title} onChangeText={setTitle} placeholder="Ex: Séance photo portrait" icon="pricetag-outline" />
          <Input label="Description" value={description} onChangeText={setDescription} placeholder="Décrivez votre service..." multiline numberOfLines={4} />

          <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm }]}>Catégorie</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.id ? theme.primary : theme.card,
                    borderColor: category === cat.id ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={[typography.labelMedium, { color: category === cat.id ? '#FFF' : theme.text }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Prix (€)" value={price} onChangeText={setPrice} placeholder="50" keyboardType="numeric" icon="cash-outline" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Durée (min)" value={duration} onChangeText={setDuration} placeholder="60" keyboardType="numeric" icon="time-outline" />
            </View>
          </View>

          <Button title="Créer le service" onPress={handleSubmit} isLoading={isSubmitting} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: spacing.xl, paddingBottom: 40 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  categoryChip: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
});
