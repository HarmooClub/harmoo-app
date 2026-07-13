import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, radius, typography } from '../src/theme';

export default function HistoryScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={[typography.h2, { color: theme.title }]}>Notre histoire</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        {/* Image placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="image-outline" size={60} color={theme.textSecondary} />
          <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.md }]}>Image à ajouter</Text>
        </View>

        {/* Text placeholder */}
        <View style={[styles.textSection, { borderColor: theme.border }]}>
          <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>L'histoire d'Harmoo</Text>
          <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>
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
  imagePlaceholder: { height: 240, borderRadius: radius.xl, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  textSection: { paddingTop: spacing.lg },
});
