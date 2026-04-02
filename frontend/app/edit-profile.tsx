import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Avatar } from '../src/components/Avatar';
import { Input } from '../src/components/Input';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { spacing, typography, radius } from '../src/theme';

export default function EditProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateUser({ avatar: base64Image });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de changer la photo');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data: any = { full_name: fullName.trim(), bio: bio.trim(), city: city.trim() };
      if (hourlyRate) data.hourly_rate = parseFloat(hourlyRate);
      await updateUser(data);
      Alert.alert('Succès', 'Profil mis à jour');
      router.back();
    } catch (e) { Alert.alert('Erreur', 'Impossible de mettre à jour'); }
    finally { setIsSaving(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Modifier le profil" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
          {/* Avatar with upload */}
          <View style={styles.avatarSection}>
            <Avatar
              uri={user?.avatar}
              name={user?.full_name || ''}
              size={100}
              borderRadius={32}
              onPress={pickImage}
              showEdit
            />
            <TouchableOpacity onPress={pickImage}>
              <Text style={[typography.labelMedium, { color: theme.primary, marginTop: spacing.sm }]}>Changer la photo</Text>
            </TouchableOpacity>
          </View>

          <Input label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Votre nom" icon="person-outline" />
          <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Parlez de vous..." multiline numberOfLines={4} />
          <Input label="Ville" value={city} onChangeText={setCity} placeholder="Paris" icon="location-outline" />

          {(user?.user_type === 'freelancer' || user?.is_provider_mode) && (
            <Input label="Tarif horaire (€)" value={hourlyRate} onChangeText={setHourlyRate} placeholder="50" keyboardType="numeric" icon="cash-outline" />
          )}

          <Button title="Enregistrer" onPress={handleSave} isLoading={isSaving} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: spacing.xl, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
});
