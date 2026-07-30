import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { BurgerMenu } from '../../src/components/BurgerMenu';
import { Avatar } from '../../src/components/Avatar';
import { spacing, radius, shadows } from '../../src/theme';
import { CATEGORY_NAMES, CATEGORY_SUBCATEGORIES } from '../../src/utils/categories';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingSocials, setEditingSocials] = useState(false);
  const [socials, setSocials] = useState({ instagram: '', tiktok: '', youtube: '', spotify: '' });

  useEffect(() => { setLocalAvatar(null); }, [user?.avatar]);
  useEffect(() => {
    if (user) {
      setSocials({
        instagram: user.instagram_url || '',
        tiktok: user.tiktok_url || '',
        youtube: user.youtube_url || '',
        spotify: user.spotify_url || '',
      });
    }
  }, [user]);

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <BurgerMenu />
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
            <Ionicons name="person-outline" size={40} color="#3B82F6" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.title }]}>Connectez-vous</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin d\'accéder à vos photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setIsUploading(true);
      setLocalAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      try {
        await updateUser({ avatar: result.assets[0].base64 } as any);
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
        setLocalAvatar(null);
      } finally { setIsUploading(false); }
    }
  };

  const saveSocials = async () => {
    try {
      await updateUser({
        instagram_url: socials.instagram || undefined,
        tiktok_url: socials.tiktok || undefined,
        youtube_url: socials.youtube || undefined,
        spotify_url: socials.spotify || undefined,
      } as any);
      setEditingSocials(false);
    } catch (e) { Alert.alert('Erreur', 'Impossible de sauvegarder'); }
  };

  const displayAvatar = localAvatar || (user.avatar ? `${process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com'}/api/avatar/${user.id}?t=${Date.now()}` : null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.profileHeader}>
          <Avatar uri={displayAvatar} name={user.full_name} size={100} borderRadius={50} onPress={pickImage} showEdit />
          <Text style={[styles.profileName, { color: theme.title }]}>{user.full_name}</Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user.email}</Text>
          {user.categories?.length > 0 && (
            <View style={[styles.categoryBadge, { backgroundColor: 'rgba(220,27,120,0.15)' }]}>
              <Text style={styles.categoryText}>{user.subcategories?.[0] || user.categories?.[0]}</Text>
            </View>
          )}
          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.locationText, { color: theme.textSecondary }]}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Admin: Edit Profile */}
        {isAdmin && (
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/edit-profile' as any)}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Ionicons name="person-outline" size={18} color="#3B82F6" />
            </View>
            <Text style={[styles.menuText, { color: theme.title }]}>Modifier mon profil</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Edit Category */}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/personal-info' as any)}>
          <View style={[styles.menuIcon, { backgroundColor: 'rgba(220,27,120,0.15)' }]}>
            <Ionicons name="briefcase-outline" size={18} color="#DC1B78" />
          </View>
          <Text style={[styles.menuText, { color: theme.title }]}>Modifier ma catégorie</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Social Links */}
        <View style={[styles.socialCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.socialHeader}>
            <Text style={[styles.socialTitle, { color: theme.title }]}>Réseaux sociaux</Text>
            <TouchableOpacity onPress={() => editingSocials ? saveSocials() : setEditingSocials(true)}>
              <Text style={styles.socialEditText}>{editingSocials ? 'Enregistrer' : 'Modifier'}</Text>
            </TouchableOpacity>
          </View>
          {editingSocials ? (
            <View style={styles.socialInputs}>
              {['instagram', 'tiktok', 'youtube', 'spotify'].map((key) => (
                <TextInput
                  key={key}
                  style={[styles.socialInput, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
                  value={socials[key as keyof typeof socials]}
                  onChangeText={(t) => setSocials({ ...socials, [key]: t })}
                  placeholder={`URL ${key.charAt(0).toUpperCase() + key.slice(1)}`}
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              ))}
            </View>
          ) : (
            <View style={styles.socialIcons}>
              {[
                { key: 'instagram', icon: 'logo-instagram', color: '#E4405F' },
                { key: 'tiktok', icon: 'logo-tiktok', color: '#000' },
                { key: 'youtube', icon: 'logo-youtube', color: '#FF0000' },
                { key: 'spotify', icon: 'musical-notes', color: '#1DB954' },
              ].map((s) => (
                <View key={s.key} style={[styles.socialIcon, { backgroundColor: socials[s.key as keyof typeof socials] ? `${s.color}20` : theme.border }]}>
                  <Ionicons name={s.icon as any} size={20} color={socials[s.key as keyof typeof socials] ? s.color : theme.textSecondary} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Join Club */}
        {!isAdmin && !user?.is_harmoo_club && (
          <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/membership' as any)}>
            <Text style={styles.joinBtnText}>Nous rejoindre</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: theme.border }]} onPress={() => { logout(); router.replace('/(auth)/welcome'); }}>
          <Text style={[styles.logoutText, { color: theme.textSecondary }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: spacing.lg },
  loginBtn: { backgroundColor: '#DC1B78', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: spacing.lg, ...shadows.glow },
  loginBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  profileHeader: { alignItems: 'center', marginBottom: spacing.xl },
  profileName: { fontSize: 24, fontWeight: '700', marginTop: spacing.md },
  profileEmail: { fontSize: 14, marginTop: 2 },
  categoryBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: spacing.sm },
  categoryText: { color: '#DC1B78', fontSize: 13, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 13, marginLeft: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 12, borderWidth: 1, marginBottom: spacing.md, ...shadows.sm },
  menuIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500' },
  socialCard: { borderRadius: 12, borderWidth: 1, padding: spacing.md, marginTop: spacing.sm, ...shadows.sm },
  socialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  socialTitle: { fontSize: 15, fontWeight: '600' },
  socialEditText: { color: '#DC1B78', fontSize: 14, fontWeight: '600' },
  socialInputs: { gap: spacing.sm },
  socialInput: { borderWidth: 1, borderRadius: 10, padding: spacing.sm, fontSize: 14 },
  socialIcons: { flexDirection: 'row', gap: spacing.sm },
  socialIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  joinBtn: { backgroundColor: '#DC1B78', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: spacing.xl, ...shadows.glow },
  joinBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  logoutBtn: { borderWidth: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: spacing.lg },
  logoutText: { fontSize: 15, fontWeight: '500' },
});
