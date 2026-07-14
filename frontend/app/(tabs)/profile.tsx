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
import { spacing, radius, typography } from '../../src/theme';
import { CATEGORY_NAMES, CATEGORY_SUBCATEGORIES } from '../../src/utils/categories';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const router = useRouter();
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingSocials, setEditingSocials] = useState(false);
  const [socials, setSocials] = useState({
    instagram: '',
    tiktok: '',
    youtube: '',
    spotify: '',
  });

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

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.header}>
          <BurgerMenu />
          <Text style={[typography.h2, { color: theme.title }]}>Profil</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-circle-outline" size={80} color={theme.textSecondary} />
          <Text style={[typography.h3, { color: theme.title, marginTop: spacing.lg }]}>Connectez-vous</Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/(auth)/login')}>
            <Text style={[typography.labelLarge, { color: '#FFF' }]}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = user.email === HARMOO_ADMIN_EMAIL;
  const displayAvatar = localAvatar || user.avatar;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission requise'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) {
      const b64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setLocalAvatar(b64);
      setIsUploading(true);
      try { await updateUser({ avatar: b64 }); } catch { setLocalAvatar(null); Alert.alert('Erreur'); }
      finally { setIsUploading(false); }
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
      Alert.alert('Succès', 'Réseaux sociaux mis à jour');
    } catch { Alert.alert('Erreur'); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Mon profil</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <View style={styles.profileHeader}>
          <Avatar uri={displayAvatar} name={user.full_name} size={96} borderRadius={32} onPress={pickImage} showEdit />
          <Text style={[typography.h2, { color: theme.title, marginTop: spacing.md }]}>{user.full_name}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>{user.email}</Text>
          {user.categories?.length > 0 && (
            <Text style={[typography.labelMedium, { color: theme.primary, marginTop: 4 }]}>
              {user.subcategories?.[0] || user.categories?.[0]}
            </Text>
          )}
          {user.location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>{user.location}</Text>
            </View>
          )}
        </View>

        {/* Admin: Edit Name & Location */}
        {isAdmin && (
          <TouchableOpacity
            style={[styles.menuItem, { borderColor: theme.border }]}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <Ionicons name="person-outline" size={22} color={theme.primary} />
            <Text style={[typography.body, { color: theme.title, flex: 1, marginLeft: 14 }]}>Modifier mon nom et localisation</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Edit category/profession */}
        <TouchableOpacity
          style={[styles.menuItem, { borderColor: theme.border }]}
          onPress={() => router.push('/personal-info' as any)}
        >
          <Ionicons name="briefcase-outline" size={22} color={theme.primary} />
          <Text style={[typography.body, { color: theme.title, flex: 1, marginLeft: 14 }]}>Modifier ma catégorie / métier</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* Social links */}
        <View style={[styles.section, { borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[typography.h3, { color: theme.title }]}>Réseaux sociaux</Text>
            <TouchableOpacity onPress={() => editingSocials ? saveSocials() : setEditingSocials(true)}>
              <Text style={[typography.labelMedium, { color: theme.primary }]}>{editingSocials ? 'Enregistrer' : 'Modifier'}</Text>
            </TouchableOpacity>
          </View>
          {editingSocials ? (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {(['instagram', 'tiktok', 'youtube', 'spotify'] as const).map((key) => (
                <View key={key} style={[styles.socialInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name={key === 'instagram' ? 'logo-instagram' : key === 'tiktok' ? 'logo-tiktok' : key === 'youtube' ? 'logo-youtube' : 'musical-note'} size={20} color={theme.primary} />
                  <TextInput
                    style={[typography.body, { color: theme.title, flex: 1, marginLeft: 10, padding: 0 }]}
                    value={socials[key]}
                    onChangeText={(t) => setSocials(prev => ({ ...prev, [key]: t }))}
                    placeholder={`Lien ${key}`}
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {socials.instagram ? <SocialRow icon="logo-instagram" label="Instagram" url={socials.instagram} theme={theme} /> : null}
              {socials.tiktok ? <SocialRow icon="logo-tiktok" label="TikTok" url={socials.tiktok} theme={theme} /> : null}
              {socials.youtube ? <SocialRow icon="logo-youtube" label="YouTube" url={socials.youtube} theme={theme} /> : null}
              {socials.spotify ? <SocialRow icon="musical-note" label="Spotify" url={socials.spotify} theme={theme} /> : null}
              {!socials.instagram && !socials.tiktok && !socials.youtube && !socials.spotify && (
                <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Aucun réseau ajouté</Text>
              )}
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { borderColor: theme.border }]}
          onPress={() => { logout(); router.replace('/(auth)/welcome'); }}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[typography.labelMedium, { color: '#EF4444', marginLeft: 8 }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SocialRow({ icon, label, url, theme }: any) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
      <Ionicons name={icon} size={18} color={theme.primary} />
      <Text style={[typography.bodySmall, { color: theme.title, marginLeft: 10 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: radius.lg, marginTop: spacing.xl },
  profileHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  menuItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, paddingVertical: 16, borderBottomWidth: 1 },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1 },
  socialInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1 },
  clubCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1.5 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: 14, borderRadius: radius.lg, borderWidth: 1 },
});
