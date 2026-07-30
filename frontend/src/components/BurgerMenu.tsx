import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, radius, shadows } from '../theme';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

interface MenuItem {
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
}

export function BurgerMenu() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  const items: MenuItem[] = [
    { icon: 'home-outline', label: 'Accueil', route: '/(tabs)' },
    { icon: 'mic-outline', label: 'Réserver une session', route: '/freelancer/4b2fa8d2-907b-467d-b7c8-47c8fe624162' },
    { icon: 'people-outline', label: 'Membres', route: '/members' },
    { icon: 'calendar-outline', label: 'Événements', route: '/events' },
    { icon: 'mail-outline', label: 'Contact', route: '/contact' },
  ];

  if (isAdmin) {
    items.push({ icon: 'construct-outline', label: 'Mes services', route: '/my-services' });
    items.push({ icon: 'cash-outline', label: 'Caisse', route: '/cash-register' });
  }

  if (user) {
    items.push({ icon: 'person-outline', label: 'Mon profil', route: '/(tabs)/profile' });
  }

  const navigate = (route: string) => {
    setOpen(false);
    setTimeout(() => router.push(route as any), 100);
  };

  return (
    <>
      <TouchableOpacity style={styles.burgerBtn} onPress={() => setOpen(true)}>
        <Ionicons name="menu" size={26} color={theme.title} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.drawer, { backgroundColor: theme.card, paddingTop: insets.top + 16 }]} onPress={(e) => e.stopPropagation()}>
            {/* Header with Logo */}
            <View style={styles.drawerHeader}>
              <Image source={require('../../assets/harmoo-logo.png')} style={styles.drawerLogo} contentFit="contain" />
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.border }]} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={20} color={theme.title} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={() => item.route ? navigate(item.route) : item.action?.()}
                >
                  <Text style={[styles.menuText, { color: theme.title }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auth buttons */}
            <View style={styles.drawerFooter}>
              {!user ? (
                <TouchableOpacity style={styles.authBtn} onPress={() => navigate('/(auth)/login')}>
                  <Text style={styles.authBtnText}>Se connecter</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.logoutBtn, { borderColor: theme.border }]}
                  onPress={() => { setOpen(false); logout(); router.replace('/(auth)/welcome'); }}
                >
                  <Text style={[styles.logoutText, { color: theme.textSecondary }]}>Se déconnecter</Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  burgerBtn: { padding: 4 },
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)' },
  drawer: { width: '80%', maxWidth: 320, height: '100%', paddingHorizontal: spacing.lg, ...shadows.lg },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  drawerLogo: { width: 120, height: 24 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  menuItems: { flex: 1 },
  menuItem: { paddingVertical: 16, borderBottomWidth: 0.5 },
  menuText: { fontSize: 16, fontWeight: '500' },
  drawerFooter: { paddingVertical: spacing.xl },
  authBtn: { backgroundColor: '#DC1B78', paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...shadows.glow },
  authBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  logoutBtn: { borderWidth: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '500' },
});
