import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert, Platform, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Avatar, getAvatarUrl } from '../../src/components/Avatar';
import { Badge } from '../../src/components/Badge';
import { Card } from '../../src/components/Card';
import { spacing, typography, radius, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');

// Storage helper
const store = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
};

interface SavedAccount {
  email: string;
  password: string;
  full_name: string;
  avatar?: string;
}

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateUser, login } = useAuth();
  const router = useRouter();
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);

  const openSwitcher = async () => {
    try {
      const raw = await store.getItem('saved_accounts');
      if (raw) {
        const accounts: SavedAccount[] = JSON.parse(raw);
        setSavedAccounts(accounts.filter(a => a.email !== user?.email));
      } else {
        setSavedAccounts([]);
      }
    } catch { setSavedAccounts([]); }
    setShowSwitcher(true);
  };

  const switchToAccount = async (acct: SavedAccount) => {
    setIsSwitching(true);
    try {
      await logout();
      await login(acct.email, acct.password);
      setShowSwitcher(false);
      router.replace('/(tabs)');
    } catch {
      if (Platform.OS === 'web') window.alert('Impossible de se connecter');
      else Alert.alert('Erreur', 'Impossible de se connecter à ce compte');
    } finally { setIsSwitching(false); }
  };

  const addAccount = async () => {
    setShowSwitcher(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Voulez-vous vous déconnecter ?');
      if (confirmed) performLogout();
    } else {
      Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: performLogout },
      ]);
    }
  };

  const performLogout = async () => {
    try { await logout(); } catch {}
    router.replace('/(auth)/welcome');
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={80} color={theme.textSecondary} />
          <Text style={[typography.h2, { color: theme.title, marginTop: spacing.lg }]}>Mon Profil</Text>
          <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.sm }]}>Connectez-vous pour accéder à votre profil</Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[typography.labelLarge, { color: '#FFF' }]}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isProvider = user.is_provider_mode === true;

  const toggleProviderMode = async () => {
    if (!user || isTogglingMode) return;
    
    // Si déjà activé → désactiver simplement
    if (isProvider) {
      setIsTogglingMode(true);
      try {
        await updateUser({ is_provider_mode: false });
      } catch { Alert.alert('Erreur', 'Impossible de changer de mode'); }
      finally { setIsTogglingMode(false); }
      return;
    }
    
    // Activation : vérifier si catégorie/profession déjà choisies
    if (user.categories && user.categories.length > 0 && user.subcategories && user.subcategories.length > 0) {
      setIsTogglingMode(true);
      try {
        await updateUser({ is_provider_mode: true, user_type: 'freelancer' });
      } catch { Alert.alert('Erreur', 'Impossible de changer de mode'); }
      finally { setIsTogglingMode(false); }
    } else {
      router.push('/setup-freelance');
    }
  };

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
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingAvatar(true);
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateUser({ avatar: base64Image });
        setIsUploadingAvatar(false);
      }
    } catch (error) {
      setIsUploadingAvatar(false);
      Alert.alert('Erreur', 'Impossible de changer la photo');
    }
  };

  const avatarUrl = getAvatarUrl(user.avatar, user.full_name);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Header */}
        <View style={styles.profileHeaderSection}>
          <Avatar
            uri={user.avatar}
            name={user.full_name}
            size={96}
            borderRadius={32}
            onPress={pickImage}
            showEdit
          />
          <Text style={[typography.h1, { color: theme.title, marginTop: spacing.lg }]}>
            {user.full_name}
          </Text>
          <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.xs }]}>
            {user.email}
          </Text>
          {user.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
              <Text style={[typography.caption, { color: theme.textSecondary }]}>{user.city}</Text>
            </View>
          )}
        </View>

        {/* Freelance Mode Toggle */}
        <Card style={styles.sectionCard}>
          <View style={styles.modeRow}>
            <View style={[styles.modeIcon, { backgroundColor: isProvider ? theme.primarySoft : theme.border + '40' }]}>
              <Ionicons name={isProvider ? 'briefcase' : 'person'} size={18} color={isProvider ? theme.primary : theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h4, { color: theme.title }]}>
                {isProvider ? 'Mode Artiste-Entrepreneur' : 'Mode Client'}
              </Text>
              <Text style={[typography.caption, { color: theme.text, marginTop: 2 }]}>
                {isProvider ? 'Vous proposez vos services' : 'Activez pour proposer vos services'}
              </Text>
            </View>
            <Switch
              value={isProvider}
              onValueChange={toggleProviderMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
              disabled={isTogglingMode}
            />
          </View>
        </Card>

        {/* Membership Banner */}
        <TouchableOpacity
          style={[styles.membershipBanner, { backgroundColor: theme.card, borderColor: '#DC1B78', borderWidth: 2 }]}
          onPress={() => router.push('/club-checkout')}
          activeOpacity={0.8}
        >
          <View style={styles.membershipLeft}>
            <View style={styles.membershipTitleRow}>
              <Text style={[styles.membershipTitle, { color: theme.title }]}>Harmoo Club</Text>
              <Badge label="30€ à vie" variant="accent" />
            </View>
            <Text style={[styles.membershipDesc, { color: theme.textSecondary }]}>Rejoignez les premiers membres</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#DC1B78" />
        </TouchableOpacity>

        {/* Provider Section */}
        {isProvider && (
          <Card style={styles.sectionCard}>
            <Text style={[typography.labelMedium, { color: theme.textSecondary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }]}>
              ESPACE ARTISTE-ENTREPRENEUR
            </Text>
            <MenuItem icon="analytics-outline" label="Tableau de bord" onPress={() => router.push('/dashboard')} theme={theme} />
            <MenuItem icon="construct-outline" label="Mes services" onPress={() => router.push('/my-services')} theme={theme} />
            <MenuItem icon="images-outline" label="Mon portfolio" onPress={() => router.push('/my-portfolio')} theme={theme} />
            <MenuItem icon="wallet-outline" label="Caisse" onPress={() => router.push('/cash-register')} theme={theme} last />
          </Card>
        )}

        {/* Account Section */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.labelMedium, { color: theme.textSecondary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }]}>
            COMPTE
          </Text>
          <MenuItem icon="create-outline" label="Modifier le profil" onPress={() => router.push('/edit-profile')} theme={theme} />
          <MenuItem icon="person-outline" label="Infos personnelles" onPress={() => router.push('/personal-info')} theme={theme} />
          <MenuItem icon="heart-outline" label="Mes favoris" onPress={() => router.push('/favorites')} theme={theme} last />
        </Card>

        {/* Preferences */}
        <Card style={styles.sectionCard}>
          <Text style={[typography.labelMedium, { color: theme.textSecondary, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }]}>
            PRÉFÉRENCES
          </Text>
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconCircle, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="moon-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[typography.bodyMedium, { color: theme.title }]}>Mode sombre</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFF"
            />
          </View>
        </Card>

        {/* Switch Account */}
        <TouchableOpacity
          style={[styles.switchButton, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '20' }]}
          onPress={openSwitcher}
          activeOpacity={0.7}
        >
          <Ionicons name="swap-horizontal" size={20} color={theme.primary} />
          <Text style={[typography.labelLarge, { color: theme.primary, marginLeft: spacing.sm }]}>Changer de compte</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.errorSoft }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={[typography.labelLarge, { color: theme.error, marginLeft: spacing.sm }]}>Déconnexion</Text>
        </TouchableOpacity>

        <Text style={[typography.tiny, { color: theme.textSecondary, textAlign: 'center', marginTop: spacing.lg }]}>
          Harmoo v2.3.0
        </Text>
      </ScrollView>

      {/* Switch Account Modal — Glassmorphism with feathered edges */}
      <Modal visible={showSwitcher} transparent animationType="fade" onRequestClose={() => setShowSwitcher(false)}>
        <View style={styles.glassOverlay}>
          {/* Soft gradient backdrop — no hard edges */}
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowSwitcher(false)}>
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
              <BlurView intensity={50} tint="light" style={[styles.glassSheet, { backgroundColor: 'transparent' }]}>
                <View style={[styles.glassSheetInner, { backgroundColor: isDark ? 'rgba(30,30,40,0.88)' : 'rgba(255,255,255,0.88)' }]}>
                  <View style={styles.handle} />
                  <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>Changer de compte</Text>

                  {user && (
                    <View style={[styles.accountRow, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '30' }]}>
                      <Avatar uri={user.avatar} name={user.full_name} size={40} borderRadius={14} />
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.labelLarge, { color: theme.title }]}>{user.full_name}</Text>
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>{user.email}</Text>
                      </View>
                      <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>Actif</Text>
                      </View>
                    </View>
                  )}

                  {savedAccounts.map((acct) => (
                    <TouchableOpacity
                      key={acct.email}
                      style={[styles.accountRow, { backgroundColor: theme.background, borderColor: theme.border }]}
                      onPress={() => switchToAccount(acct)}
                      disabled={isSwitching}
                    >
                      <Avatar uri={acct.avatar} name={acct.full_name} size={40} borderRadius={14} />
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.labelLarge, { color: theme.title }]}>{acct.full_name}</Text>
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>{acct.email}</Text>
                      </View>
                      <Ionicons name="swap-horizontal" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  ))}

                  {savedAccounts.length === 0 && (
                    <Text style={[typography.bodySmall, { color: theme.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }]}>
                      Aucun autre compte mémorisé
                    </Text>
                  )}

                  <TouchableOpacity style={[styles.addAccountBtn, { borderColor: theme.border }]} onPress={addAccount}>
                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                    <Text style={[typography.labelLarge, { color: theme.primary }]}>Se connecter à un autre compte</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            ) : (
              <View style={[styles.glassSheetWeb, { backgroundColor: isDark ? 'rgba(30,30,40,0.92)' : 'rgba(255,255,255,0.92)' }]}>
                <View style={[styles.glassSheetInner, { backgroundColor: isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                  <View style={styles.handle} />
                  <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>Changer de compte</Text>

                  {user && (
                    <View style={[styles.accountRow, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '30' }]}>
                      <Avatar uri={user.avatar} name={user.full_name} size={40} borderRadius={14} />
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.labelLarge, { color: theme.title }]}>{user.full_name}</Text>
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>{user.email}</Text>
                      </View>
                      <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>Actif</Text>
                      </View>
                    </View>
                  )}

                  {savedAccounts.map((acct) => (
                    <TouchableOpacity
                      key={acct.email}
                      style={[styles.accountRow, { backgroundColor: theme.background, borderColor: theme.border }]}
                      onPress={() => switchToAccount(acct)}
                      disabled={isSwitching}
                    >
                      <Avatar uri={acct.avatar} name={acct.full_name} size={40} borderRadius={14} />
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.labelLarge, { color: theme.title }]}>{acct.full_name}</Text>
                        <Text style={[typography.caption, { color: theme.textSecondary }]}>{acct.email}</Text>
                      </View>
                      <Ionicons name="swap-horizontal" size={18} color={theme.primary} />
                    </TouchableOpacity>
                  ))}

                  {savedAccounts.length === 0 && (
                    <Text style={[typography.bodySmall, { color: theme.textSecondary, textAlign: 'center', paddingVertical: spacing.lg }]}>
                      Aucun autre compte mémorisé
                    </Text>
                  )}

                  <TouchableOpacity style={[styles.addAccountBtn, { borderColor: theme.border }]} onPress={addAccount}>
                    <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
                    <Text style={[typography.labelLarge, { color: theme.primary }]}>Se connecter à un autre compte</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress, theme, last }: { icon: string; label: string; onPress: () => void; theme: any; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        !last && { borderBottomWidth: 0.5, borderBottomColor: theme.divider },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconCircle, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon as any} size={18} color={theme.primary} />
        </View>
        <Text style={[typography.bodyMedium, { color: theme.title }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  loginBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: radius.lg, marginTop: spacing.xxl },
  profileHeaderSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipBanner: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membershipLeft: { flex: 1 },
  membershipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  membershipTitle: { ...typography.h3, color: '#FFF' },
  membershipDesc: { ...typography.caption, color: '#FFF', opacity: 0.6, marginTop: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
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
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  activeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
});
