import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, shadows } from '../src/theme';

export default function HistoryScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={styles.headerTitle}>Notre histoire</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Image placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.placeholderIcon, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
            <Ionicons name="image-outline" size={32} color="#3B82F6" />
          </View>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Image à ajouter</Text>
        </View>

        {/* Text section */}
        <View style={[styles.textCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.storyTitle, { color: theme.title }]}>L'histoire d'Harmoo</Text>
          <Text style={[styles.storyText, { color: theme.textSecondary }]}>
            Le texte de l'histoire sera ajouté ici. Racontez l'origine d'Harmoo Club, la vision, la mission et les valeurs qui animent ce projet.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  imagePlaceholder: { height: 240, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl, ...shadows.sm },
  placeholderIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  placeholderText: { fontSize: 14, fontWeight: '500' },
  textCard: { borderRadius: 16, borderWidth: 1, padding: spacing.xl, ...shadows.sm },
  storyTitle: { fontSize: 22, fontWeight: '700', marginBottom: spacing.lg, letterSpacing: -0.3 },
  storyText: { fontSize: 15, lineHeight: 24 },
});
