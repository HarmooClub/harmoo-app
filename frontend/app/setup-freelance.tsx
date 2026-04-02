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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [primaryCategory, setPrimaryCategory] = useState<string | null>(null);
  const [primaryProfession, setPrimaryProfession] = useState<string | null>(null);
  const [secondaryCategory, setSecondaryCategory] = useState<string | null>(null);
  const [secondaryProfession, setSecondaryProfession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) { setStep(1); setPrimaryProfession(null); }
    else router.back();
  };

  const handleConfirm = async () => {
    if (!primaryCategory || !primaryProfession) return;
    setIsLoading(true);
    try {
      const categories = [primaryCategory];
      const subcategories = [primaryProfession];
      if (secondaryCategory) categories.push(secondaryCategory);
      if (secondaryProfession) subcategories.push(secondaryProfession);

      await updateUser({
        is_provider_mode: true,
        user_type: 'freelancer',
        categories,
        subcategories,
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

  const stepLabels = {
    1: { title: 'Domaine principal', sub: 'Dans quel domaine exercez-vous principalement ?' },
    2: { title: 'Profession principale', sub: `Professions en ${CATEGORY_NAMES[primaryCategory || '']}` },
    3: { title: 'Domaine secondaire', sub: 'Un autre domaine ? (optionnel)' },
    4: { title: 'Profession secondaire', sub: `Professions en ${CATEGORY_NAMES[secondaryCategory || '']}` },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={[styles.backIcon, { backgroundColor: theme.card }]}>
          <Ionicons name="chevron-back" size={22} color={theme.title} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[typography.displayMedium, { color: theme.title }]}>
            {stepLabels[step].title}
          </Text>
          <Text style={[typography.bodySmall, { color: theme.text, marginTop: spacing.xs }]}>
            {stepLabels[step].sub}
          </Text>
        </View>
      </View>

      {/* Step indicator */}
      <View style={styles.stepRow}>
        <View style={[styles.stepDot, { backgroundColor: theme.primary }]} />
        <View style={[styles.stepLine, { backgroundColor: step >= 2 ? theme.primary : theme.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step >= 2 ? theme.primary : theme.border }]} />
        <View style={[styles.stepLine, { backgroundColor: step >= 3 ? theme.primary : theme.border }]} />
        <View style={[styles.stepDot, { backgroundColor: step >= 3 ? theme.primary : theme.border }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Primary category */}
        {step === 1 && (
          <View style={styles.grid}>
            {Object.entries(CATEGORY_NAMES).map(([catId, catName]) => (
              <TouchableOpacity
                key={catId}
                style={[styles.categoryCard, {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }]}
                onPress={() => { setPrimaryCategory(catId); setPrimaryProfession(null); setStep(2); }}
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

        {/* Step 2: Primary profession */}
        {step === 2 && primaryCategory && (
          <View style={styles.professionList}>
            {(CATEGORY_SUBCATEGORIES[primaryCategory] || []).map((profession) => {
              const isSelected = primaryProfession === profession;
              const display = profession.charAt(0).toUpperCase() + profession.slice(1);
              return (
                <TouchableOpacity
                  key={profession}
                  style={[styles.professionItem, {
                    backgroundColor: isSelected ? theme.primarySoft : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }]}
                  onPress={() => setPrimaryProfession(profession)}
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

            {primaryProfession && (
              <Button
                title="Suivant → Domaine secondaire (optionnel)"
                onPress={() => setStep(3)}
                style={{ marginTop: spacing.xl }}
              />
            )}
          </View>
        )}

        {/* Step 3: Secondary category (optional) */}
        {step === 3 && (
          <View>
            <View style={styles.grid}>
              {Object.entries(CATEGORY_NAMES)
                .filter(([catId]) => catId !== primaryCategory)
                .map(([catId, catName]) => (
                <TouchableOpacity
                  key={catId}
                  style={[styles.categoryCard, {
                    backgroundColor: secondaryCategory === catId ? theme.primarySoft : theme.card,
                    borderColor: secondaryCategory === catId ? theme.primary : theme.border,
                  }]}
                  onPress={() => { setSecondaryCategory(catId); setSecondaryProfession(null); setStep(4); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={28} color={secondaryCategory === catId ? theme.primary : theme.textSecondary} />
                  <Text style={[typography.labelMedium, { color: theme.title, marginTop: spacing.sm, textAlign: 'center' }]} numberOfLines={2}>
                    {catName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Passer et activer mon profil"
              onPress={handleConfirm}
              isLoading={isLoading}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {/* Step 4: Secondary profession */}
        {step === 4 && secondaryCategory && (
          <View style={styles.professionList}>
            {(CATEGORY_SUBCATEGORIES[secondaryCategory] || []).map((profession) => {
              const isSelected = secondaryProfession === profession;
              const display = profession.charAt(0).toUpperCase() + profession.slice(1);
              return (
                <TouchableOpacity
                  key={profession}
                  style={[styles.professionItem, {
                    backgroundColor: isSelected ? theme.primarySoft : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  }]}
                  onPress={() => setSecondaryProfession(profession)}
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

            {secondaryProfession && (
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
