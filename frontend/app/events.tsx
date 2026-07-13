import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';

export default function EventsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Événements</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Placeholder event cards */}
        {[1, 2, 3].map((i) => (
          <TouchableOpacity key={i} style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.eventImage, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="calendar" size={40} color={theme.primary} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={[typography.h3, { color: theme.title }]}>Événement à venir {i}</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>Date à confirmer</Text>
              <View style={[styles.shotgunBadge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[typography.caption, { color: theme.primary, fontWeight: '600' }]}>Lien Shotgun à ajouter</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  eventCard: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  eventImage: { height: 160, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { padding: spacing.lg },
  shotgunBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: spacing.sm },
});
