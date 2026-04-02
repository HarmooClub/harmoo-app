import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { CATEGORY_NAMES, CATEGORY_ICONS, CATEGORY_SUBCATEGORIES } from '../../src/utils/categories';
import { spacing, typography, radius } from '../../src/theme';

// Total steps: 1 (info) + 2 (password) + [3 (category) + 4 (profession)] for freelancers
const TOTAL_STEPS_CLIENT = 2;
const TOTAL_STEPS_FREELANCER = 6;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'client' | 'freelancer'>('client');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [secondaryCategory, setSecondaryCategory] = useState<string | null>(null);
  const [secondaryProfession, setSecondaryProfession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = userType === 'freelancer' ? TOTAL_STEPS_FREELANCER : TOTAL_STEPS_CLIENT;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Nom complet requis';
    if (!email) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = 'Mot de passe requis';
    else if (password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      if (userType === 'freelancer') {
        setStep(3); // Go to category selection
      } else {
        setStep(2); // Go to password
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(1);
      setSelectedCategory(null);
      setSelectedProfession(null);
    } else if (step === 4) {
      setStep(3);
      setSelectedProfession(null);
    } else if (step === 5) {
      setStep(4);
      setSecondaryCategory(null);
      setSecondaryProfession(null);
    } else if (step === 6) {
      setStep(5);
      setSecondaryProfession(null);
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedProfession(null);
    setStep(4); // Go to profession selection
  };

  const handleProfessionSelect = (profession: string) => {
    setSelectedProfession(profession);
    // Don't auto-advance — user can choose secondary or go to password
  };

  const handleSecondaryCategorySelect = (catId: string) => {
    setSecondaryCategory(catId);
    setSecondaryProfession(null);
    setStep(6);
  };

  const handleSecondaryProfessionSelect = (profession: string) => {
    setSecondaryProfession(profession);
    setStep(2); // Go to password
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    setIsLoading(true);
    try {
      const categories = selectedCategory ? [selectedCategory] : [];
      const subcategories = selectedProfession ? [selectedProfession] : [];
      if (secondaryCategory) categories.push(secondaryCategory);
      if (secondaryProfession) subcategories.push(secondaryProfession);
      await register(email, password, fullName, userType, categories, subcategories);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 100);
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Créez votre compte';
      case 2: return 'Sécurisez votre compte';
      case 3: return 'Domaine principal';
      case 4: return 'Profession principale';
      case 5: return 'Domaine secondaire';
      case 6: return 'Profession secondaire';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Renseignez vos informations';
      case 2: return 'Choisissez un mot de passe';
      case 3: return 'Dans quel domaine exercez-vous ?';
      case 4: return selectedCategory ? `Professions en ${CATEGORY_NAMES[selectedCategory]}` : 'Sélectionnez votre métier';
      case 5: return 'Un autre domaine ? (optionnel)';
      case 6: return secondaryCategory ? `Professions en ${CATEGORY_NAMES[secondaryCategory]}` : '';
      default: return '';
    }
  };

  // Calculate step indicator progress
  const stepIndicatorCount = totalSteps;
  const currentStepIndex = () => {
    if (userType === 'client') return step;
    // Freelancer: 1 -> 3 -> 4 -> 5 -> 6 -> 2
    if (step === 1) return 1;
    if (step === 3) return 2;
    if (step === 4) return 3;
    if (step === 5) return 4;
    if (step === 6) return 5;
    if (step === 2) return 6;
    return step;
  };

  const renderCategorySelection = () => {
    const categoryEntries = Object.entries(CATEGORY_NAMES);
    return (
      <View style={styles.categoryGrid}>
        {categoryEntries.map(([catId, catName]) => {
          const iconName = CATEGORY_ICONS[catId] || 'grid';
          const isSelected = selectedCategory === catId;
          return (
            <TouchableOpacity
              key={catId}
              style={[
                styles.categoryCard,
                {
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleCategorySelect(catId)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={iconName as any}
                size={28}
                color={isSelected ? '#FFF' : theme.primary}
              />
              <Text
                style={[
                  typography.labelMedium,
                  {
                    color: isSelected ? '#FFF' : theme.title,
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  },
                ]}
                numberOfLines={2}
              >
                {catName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderProfessionSelection = () => {
    if (!selectedCategory) return null;
    const professions = CATEGORY_SUBCATEGORIES[selectedCategory] || [];
    return (
      <View style={styles.professionList}>
        {professions.map((profession) => {
          const isSelected = selectedProfession === profession;
          const displayName = profession.charAt(0).toUpperCase() + profession.slice(1);
          return (
            <TouchableOpacity
              key={profession}
              style={[
                styles.professionItem,
                {
                  backgroundColor: isSelected ? theme.primarySoft : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              onPress={() => handleProfessionSelect(profession)}
              activeOpacity={0.7}
            >
              <Text style={[typography.bodyMedium, { color: isSelected ? theme.primary : theme.title, fontWeight: isSelected ? '600' : '400' }]}>
                {displayName}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
        {selectedProfession && (
          <View style={{ marginTop: spacing.lg }}>
            <TouchableOpacity onPress={() => setStep(5)} style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={[typography.bodySmall, { color: theme.primary }]}>+ Ajouter un domaine secondaire (optionnel)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={() => setStep(2)}
            >
              <Text style={[typography.labelLarge, { color: '#FFF' }]}>Suivant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSecondaryCategorySelection = () => {
    const categoryEntries = Object.entries(CATEGORY_NAMES).filter(([catId]) => catId !== selectedCategory);
    return (
      <View>
        <View style={styles.categoryGrid}>
          {categoryEntries.map(([catId, catName]) => {
            const iconName = CATEGORY_ICONS[catId] || 'grid';
            const isSelected = secondaryCategory === catId;
            return (
              <TouchableOpacity
                key={catId}
                style={[styles.categoryCard, { backgroundColor: isSelected ? theme.primary : theme.card, borderColor: isSelected ? theme.primary : theme.border }]}
                onPress={() => handleSecondaryCategorySelect(catId)}
                activeOpacity={0.7}
              >
                <Ionicons name={iconName as any} size={28} color={isSelected ? '#FFF' : theme.primary} />
                <Text style={[typography.labelMedium, { color: isSelected ? '#FFF' : theme.title, marginTop: spacing.sm, textAlign: 'center' }]} numberOfLines={2}>
                  {catName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity onPress={() => setStep(2)} style={{ alignItems: 'center', marginTop: spacing.lg }}>
          <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Passer cette étape</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSecondaryProfessionSelection = () => {
    if (!secondaryCategory) return null;
    const professions = CATEGORY_SUBCATEGORIES[secondaryCategory] || [];
    return (
      <View style={styles.professionList}>
        {professions.map((profession) => {
          const isSelected = secondaryProfession === profession;
          const displayName = profession.charAt(0).toUpperCase() + profession.slice(1);
          return (
            <TouchableOpacity
              key={profession}
              style={[styles.professionItem, { backgroundColor: isSelected ? theme.primarySoft : theme.card, borderColor: isSelected ? theme.primary : theme.border }]}
              onPress={() => handleSecondaryProfessionSelect(profession)}
              activeOpacity={0.7}
            >
              <Text style={[typography.bodyMedium, { color: isSelected ? theme.primary : theme.title, fontWeight: isSelected ? '600' : '400' }]}>
                {displayName}
              </Text>
              {isSelected && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <View style={[styles.backIcon, { backgroundColor: theme.card }]}>
              <Ionicons name="chevron-back" size={22} color={theme.title} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={[typography.displayMedium, { color: theme.title }]}>Inscription</Text>
            <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.sm }]}>
              {getStepSubtitle()}
            </Text>
            <View style={styles.stepIndicator}>
              {Array.from({ length: stepIndicatorCount }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.step,
                    {
                      backgroundColor: i < currentStepIndex() ? theme.primary : theme.border,
                      flex: 1,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <View>
              <Input label="Nom complet" placeholder="Jean Dupont" value={fullName} onChangeText={setFullName} autoCapitalize="words" error={errors.fullName} icon="person-outline" />
              <Input label="Email" placeholder="votre@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" error={errors.email} icon="mail-outline" />

              <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.md }]}>Je suis</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: userType === 'client' ? theme.primary : theme.card,
                      borderColor: userType === 'client' ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => { setUserType('client'); setSelectedCategory(null); setSelectedProfession(null); }}
                >
                  <Ionicons name="briefcase" size={22} color={userType === 'client' ? '#FFF' : theme.text} />
                  <Text style={[typography.h4, { color: userType === 'client' ? '#FFF' : theme.title, marginTop: spacing.sm }]}>Client</Text>
                  <Text style={[typography.tiny, { color: userType === 'client' ? 'rgba(255,255,255,0.8)' : theme.text, marginTop: spacing.xs, textAlign: 'center' }]}>
                    Je cherche des créatifs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: userType === 'freelancer' ? theme.primary : theme.card,
                      borderColor: userType === 'freelancer' ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setUserType('freelancer')}
                >
                  <Ionicons name="color-palette" size={22} color={userType === 'freelancer' ? '#FFF' : theme.text} />
                  <Text style={[typography.h4, { color: userType === 'freelancer' ? '#FFF' : theme.title, marginTop: spacing.sm, textAlign: 'center' }]}>Artiste-Entrepreneur</Text>
                  <Text style={[typography.tiny, { color: userType === 'freelancer' ? 'rgba(255,255,255,0.8)' : theme.text, marginTop: spacing.xs, textAlign: 'center' }]}>
                    Je propose mes services
                  </Text>
                </TouchableOpacity>
              </View>

              <Button title="Continuer" onPress={handleNext} style={{ marginTop: spacing.lg }} />
            </View>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <View>
              {/* Show selected category/profession summary for freelancers */}
              {userType === 'freelancer' && selectedCategory && selectedProfession && (
                <View style={[styles.selectionSummary, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '30' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.labelMedium, { color: theme.primary }]}>
                      {CATEGORY_NAMES[selectedCategory]}
                    </Text>
                    <Text style={[typography.bodySmall, { color: theme.text, marginTop: 2 }]}>
                      {selectedProfession.charAt(0).toUpperCase() + selectedProfession.slice(1)}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                </View>
              )}

              <Input label="Mot de passe" placeholder="Minimum 6 caractères" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} icon="lock-closed-outline" />
              <Input label="Confirmer" placeholder="Confirmez votre mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} icon="lock-closed-outline" />
              <Button title="Créer mon compte" onPress={handleRegister} isLoading={isLoading} style={{ marginTop: spacing.lg }} />
            </View>
          )}

          {/* Step 3: Category Selection (Freelancer only) */}
          {step === 3 && (
            <View>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>
                Dans quel domaine exercez-vous ?
              </Text>
              {renderCategorySelection()}
            </View>
          )}

          {/* Step 4: Profession Selection (Freelancer only) */}
          {step === 4 && (
            <View>
              <View style={[styles.selectedCategoryBadge, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={(CATEGORY_ICONS[selectedCategory || ''] || 'grid') as any} size={18} color={theme.primary} />
                <Text style={[typography.labelMedium, { color: theme.primary }]}>
                  {selectedCategory ? CATEGORY_NAMES[selectedCategory] : ''}
                </Text>
              </View>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg, marginTop: spacing.md }]}>
                Quelle est votre profession ?
              </Text>
              {renderProfessionSelection()}
            </View>
          )}

          {/* Step 5: Secondary Category (Freelancer only) */}
          {step === 5 && (
            <View>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>
                Un autre domaine ?
              </Text>
              {renderSecondaryCategorySelection()}
            </View>
          )}

          {/* Step 6: Secondary Profession (Freelancer only) */}
          {step === 6 && (
            <View>
              <View style={[styles.selectedCategoryBadge, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={(CATEGORY_ICONS[secondaryCategory || ''] || 'grid') as any} size={18} color={theme.primary} />
                <Text style={[typography.labelMedium, { color: theme.primary }]}>
                  {secondaryCategory ? CATEGORY_NAMES[secondaryCategory] : ''}
                </Text>
              </View>
              <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg, marginTop: spacing.md }]}>
                Profession secondaire
              </Text>
              {renderSecondaryProfessionSelection()}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[typography.bodySmall, { color: theme.text }]}>Déjà un compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[typography.labelLarge, { color: theme.primary, marginLeft: spacing.xs }]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: 40 },
  backBtn: { marginBottom: spacing.lg },
  backIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  headerSection: { marginBottom: spacing.xxxl },
  stepIndicator: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  step: { height: 4, borderRadius: 2 },
  typeContainer: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  typeButton: { flex: 1, padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1.5, alignItems: 'center' },
  // Category selection grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  // Profession selection list
  professionList: {
    gap: spacing.sm,
  },
  professionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  selectedCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
  },
});
