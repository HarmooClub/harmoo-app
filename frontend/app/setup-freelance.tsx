import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Button } from '../src/components/Button';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { CATEGORY_NAMES, CATEGORY_ICONS, CATEGORY_SUBCATEGORIES } from '../src/utils/categories';
import { spacing, typography, radius } from '../src/theme';

export default function SetupFreelanceScreen() {
  const { theme } = useTheme();
  const { updateUser } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedProfession(null);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedProfession(null);
    } else {
      router.back();
    }
  };

  const handleConfirm = async () => {
    if (!selectedCategory || !selectedProfession) return;
    setIsLoading(true);
    try {
      await updateUser({
        is_provider_mode: true,
        user_type: 'freelancer',
        categories: [selectedCategory],
        subcategories: [selectedProfession],
      });
      if (Platform.OS === 'web') {
        window.alert('Mode Artiste-Entrepreneur activé !');
      } else {
        Alert.alert('Bienvenue !', 'Votre profil Artiste-Entrepreneur est prêt.');
      }
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'activer le mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.backIcon, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={22} color={theme.title} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[typography.displayMedium, { color: theme.title }]}>
            {step === 1 ? 'Votre domaine' : 'Votre profession'}
          </Text>
          <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.xs }]}>
            {step === 1
              ? 'Dans quel domaine exercez-vous ?'
              : `Professions en ${CATEGORY_NAMES[selectedCategory || '']}`}
          </Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
        <View style={[styles.stepLine, { backgroundColor: step === 2 ? theme.primary : theme.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step === 2 ? theme.primary : theme.border }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Category */}
        {step === 1 && (
          <View style={styles.grid}>
            {Object.entries(CATEGORY_NAMES).map(([catId, catName]) => (
              <TouchableOpacity
                key={catId}
                style={[styles.categoryCard, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}
                onPress={() => handleCategorySelect(catId)}
                activeOpacity={0.7}
              >
                <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={28} color={theme.primary} />
                <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.sm, textAlign: 'center' }]} numberOfLines={2}>
                  {catName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Step 2: Profession */}
        {step === 2 && selectedCategory && (
          <View style={styles.professionList}>
            {(CATEGORY_SUBCATEGORIES[selectedCategory] || []).map((profession) => {
              const isSelected = selectedProfession === profession;
              const display = profession.charAt(0).toUpperCase() + profession.slice(1);
              return (
                <TouchableOpacity
                  key={profession}
                  style={[styles.professionItem, {
                    backgroundColor: isSelected ? theme.primarySoft : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }]}
                  onPress={() => setSelectedProfession(profession)}
                  activeOpacity={0.7}
                >
                  <Text style={[typography.bodyMedium, {
                    color: isSelected ? theme.primary : theme.title,
                    fontWeight: isSelected ? '600' : '400',
                  }]}>
                    {display}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                </TouchableOpacity>
              );
            })}

            {selectedProfession && (
              <Button
                title="Activer le mode Artiste-Entrepreneur"
                onPress={handleConfirm}
                isLoading={isLoading}
                style={{ marginTop: spacing.xl }}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: spacing.lg,
    gap: 0,
  },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { height: 2, flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: 60 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  categoryCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  professionList: { gap: spacing.sm },
  professionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
