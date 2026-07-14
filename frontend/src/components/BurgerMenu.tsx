import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, radius, typography } from '../theme';

const HARMOO_ADMIN_EMAIL = 'harmoo.app@gmail.com';

type MenuItem = { icon: string; label: string; route?: string; action?: () => void };

export function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAdmin = user?.email === HARMOO_ADMIN_EMAIL;

  const navigate = (route: string) => {
    setOpen(false);
    setTimeout(() => router.push(route as any), 150);
  };

  const items: MenuItem[] = [
    { icon: 'home-outline', label: 'Accueil', route: '/(tabs)' },
    { icon: 'mic-outline', label: 'Réserver une session', route: '/freelancer/4b2fa8d2-907b-467d-b7c8-47c8fe624162' },
    { icon: 'people-outline', label: 'Membres', route: '/members' },
    { icon: 'calendar-outline', label: 'Événements', route: '/events' },
    { icon: 'book-outline', label: 'Histoire', route: '/history' },
  ];

  if (user) {
    items.push({ icon: 'person-outline', label: 'Mon profil', route: '/(tabs)/profile' });
    items.push({ icon: 'receipt-outline', label: 'Mes réservations', route: '/(tabs)/bookings' });
    if (isAdmin) {
      items.push({ icon: 'construct-outline', label: 'Mes services', route: '/my-services' });
      items.push({ icon: 'wallet-outline', label: 'Caisse', route: '/cash-register' });
    }
  }

  return (
    <>
      {/* Burger icon */}
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.burgerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="menu" size={28} color={theme.title} />
      </TouchableOpacity>

      {/* Menu overlay */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.drawer, { backgroundColor: theme.card, paddingTop: insets.top + 16 }]}>
            {/* Header with Logo */}
            <View style={styles.drawerHeader}>
              <Image
                source={require('../../assets/harmoo-logo.png')}
                style={styles.drawerLogo}
                contentFit="contain"
              />
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={28} color={theme.title} />
              </TouchableOpacity>
            </View>

            {/* Menu items */}
            <View style={styles.menuItems}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.menuItem, { borderBottomColor: theme.divider }]}
                  onPress={() => item.route ? navigate(item.route) : item.action?.()}
                >
                  <Text style={[typography.body, { color: theme.title }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auth buttons */}
            <View style={styles.drawerFooter}>
              {!user ? (
                <TouchableOpacity
                  style={[styles.authBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigate('/(auth)/login')}
                >
                  <Text style={[typography.labelLarge, { color: '#FFF' }]}>Se connecter</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.authBtn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]}
                  onPress={() => { setOpen(false); logout(); router.replace('/(auth)/welcome'); }}
                >
                  <Text style={[typography.labelLarge, { color: theme.textSecondary }]}>Se déconnecter</Text>
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
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: { width: '80%', maxWidth: 320, height: '100%', paddingHorizontal: spacing.lg },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  drawerLogo: { width: 120, height: 24 },
  menuItems: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 0.5 },
  drawerFooter: { paddingVertical: spacing.xl },
  authBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: radius.lg },
});
