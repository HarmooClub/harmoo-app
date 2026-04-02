import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { CATEGORY_NAMES, CATEGORY_ICONS, CATEGORY_SUBCATEGORIES } from '../src/utils/categories';
import { spacing, typography, radius } from '../src/theme';

export default function PersonalInfoScreen() {
  const { theme, isDark } = useTheme();
  const { user, updateUser } = useAuth();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrganizationModal, setShowOrganizationModal] = useState(false);
  const [organizationInput, setOrganizationInput] = useState(user?.organization || '');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [secondaryCategory, setSecondaryCategory] = useState<string | null>(null);
  const [secondaryProfession, setSecondaryProfession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isFreelancer = user?.is_provider_mode || user?.user_type === 'freelancer';

  const openCategoryModal = () => {
    if (user?.categories?.length) setSelectedCategory(user.categories[0]);
    if (user?.subcategories?.length) setSelectedProfession(user.subcategories[0]);
    if (user?.categories?.length > 1) setSecondaryCategory(user.categories[1]);
    if (user?.subcategories?.length > 1) setSecondaryProfession(user.subcategories[1]);
    setStep(1);
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (catId !== user?.categories?.[0]) setSelectedProfession(null);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!selectedCategory || !selectedProfession) return;
    setIsLoading(true);
    try {
      const categories = [selectedCategory];
      const subcategories = [selectedProfession];
      if (secondaryCategory) categories.push(secondaryCategory);
      if (secondaryProfession) subcategories.push(secondaryProfession);
      await updateUser({ categories, subcategories });
      setShowCategoryModal(false);
      if (Platform.OS === 'web') window.alert('Catégories mises à jour !');
      else Alert.alert('Succès', 'Vos catégories ont été mises à jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowCategoryModal(false);
    setStep(1);
  };

  const handleSaveOrganization = async () => {
    setIsLoading(true);
    try {
      await updateUser({ organization: organizationInput.trim() });
      setShowOrganizationModal(false);
      if (Platform.OS === 'web') {
        window.alert('Organisation mise à jour !');
      } else {
        Alert.alert('Succès', 'Organisation mise à jour.');
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const InfoRow = ({ label, value, onPress, editable }: { label: string; value: string; onPress?: () => void; editable?: boolean }) => (
    <TouchableOpacity 
      style={[styles.infoRow, { borderBottomColor: theme.divider }]}
      onPress={onPress}
      disabled={!editable}
      activeOpacity={editable ? 0.6 : 1}
    >
      <View style={{ flex: 1 }}>
        <Text style={[typography.caption, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[typography.bodyMedium, { color: theme.title, fontWeight: '500' }]}>{value || 'Non renseigné'}</Text>
      </View>
      {editable && (
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const currentCategoryName = user?.categories?.length ? CATEGORY_NAMES[user.categories[0]] || user.categories[0] : '';
  const currentProfessionName = user?.subcategories?.length 
    ? user.subcategories[0].charAt(0).toUpperCase() + user.subcategories[0].slice(1) 
    : '';
  const secondaryCategoryName = user?.categories?.length > 1 ? CATEGORY_NAMES[user.categories[1]] || user.categories[1] : '';
  const secondaryProfessionName = user?.subcategories?.length > 1
    ? user.subcategories[1].charAt(0).toUpperCase() + user.subcategories[1].slice(1)
    : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Infos personnelles" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card padding={0}>
          <InfoRow label="Nom" value={user?.full_name || ''} />
          <InfoRow label="Email" value={user?.email || ''} />
          <InfoRow label="Ville" value={user?.city || ''} />
          <InfoRow label="Type de compte" value={user?.user_type === 'freelancer' ? 'Artiste-Entrepreneur' : 'Client'} />
          {isFreelancer && (
            <InfoRow 
              label="Organisation" 
              value={user?.organization || ''} 
              onPress={() => setShowOrganizationModal(true)}
              editable
            />
          )}
          {user?.hourly_rate ? <InfoRow label="Tarif horaire" value={`${user.hourly_rate}€/h`} /> : null}
        </Card>

        {/* Section Catégorie / Profession - Only for freelancers */}
        {isFreelancer && (
          <Card padding={0} style={{ marginTop: spacing.lg }}>
            <View style={[styles.sectionHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[typography.labelMedium, { color: theme.textSecondary }]}>CATÉGORIE & PROFESSION</Text>
            </View>
            <InfoRow 
              label="Catégorie" 
              value={currentCategoryName} 
              onPress={openCategoryModal}
              editable
            />
            <InfoRow 
              label="Profession principale" 
              value={currentProfessionName} 
              onPress={openCategoryModal}
              editable
            />
            {secondaryCategoryName ? (
              <>
                <InfoRow 
                  label="Catégorie secondaire" 
                  value={secondaryCategoryName} 
                  onPress={openCategoryModal}
                  editable
                />
                <InfoRow 
                  label="Profession secondaire" 
                  value={secondaryProfessionName} 
                  onPress={openCategoryModal}
                  editable
                />
              </>
            ) : (
              <TouchableOpacity 
                style={{ padding: spacing.lg, alignItems: 'center' }} 
                onPress={openCategoryModal}
              >
                <Text style={[typography.bodySmall, { color: theme.primary }]}>+ Ajouter une catégorie secondaire</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Category/Profession Selection Modal */}
      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.glassOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </TouchableOpacity>

          <View style={styles.glassModalContainer} pointerEvents="box-none">
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
                  
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    {step > 1 && (
                      <TouchableOpacity onPress={() => setStep(step === 4 ? 3 : step === 3 ? 2 : 1)} style={styles.modalBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={theme.title} />
                      </TouchableOpacity>
                    )}
                    <Text style={[typography.h2, { color: theme.title, flex: 1 }]}>
                      {step === 1 ? 'Catégorie principale' : step === 2 ? 'Profession principale' : step === 3 ? 'Catégorie secondaire' : 'Profession secondaire'}
                    </Text>
                  </View>

                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                    {step === 1 && (
                      <View style={styles.grid}>
                        {Object.entries(CATEGORY_NAMES).map(([catId, catName]) => {
                          const isSelected = selectedCategory === catId;
                          return (
                            <TouchableOpacity key={catId} style={[styles.categoryCard, { backgroundColor: isSelected ? theme.primarySoft : theme.card, borderColor: isSelected ? theme.primary : theme.border }]} onPress={() => handleCategorySelect(catId)} activeOpacity={0.7}>
                              <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={24} color={isSelected ? theme.primary : theme.textSecondary} />
                              <Text style={[typography.labelSmall, { color: isSelected ? theme.primary : theme.title, marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>{catName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 2 && selectedCategory && (
                      <View style={styles.professionList}>
                        {(CATEGORY_SUBCATEGORIES[selectedCategory] || []).map((p) => {
                          const isSel = selectedProfession === p;
                          return (
                            <TouchableOpacity key={p} style={[styles.professionItem, { backgroundColor: isSel ? theme.primarySoft : theme.card, borderColor: isSel ? theme.primary : theme.border }]} onPress={() => setSelectedProfession(p)} activeOpacity={0.7}>
                              <Text style={[typography.bodyMedium, { color: isSel ? theme.primary : theme.title, fontWeight: isSel ? '600' : '400' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                              {isSel && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 3 && (
                      <View style={styles.grid}>
                        {Object.entries(CATEGORY_NAMES).filter(([c]) => c !== selectedCategory).map(([catId, catName]) => {
                          const isSelected = secondaryCategory === catId;
                          return (
                            <TouchableOpacity key={catId} style={[styles.categoryCard, { backgroundColor: isSelected ? theme.primarySoft : theme.card, borderColor: isSelected ? theme.primary : theme.border }]} onPress={() => { setSecondaryCategory(catId); setSecondaryProfession(null); setStep(4); }} activeOpacity={0.7}>
                              <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={24} color={isSelected ? theme.primary : theme.textSecondary} />
                              <Text style={[typography.labelSmall, { color: isSelected ? theme.primary : theme.title, marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>{catName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 4 && secondaryCategory && (
                      <View style={styles.professionList}>
                        {(CATEGORY_SUBCATEGORIES[secondaryCategory] || []).map((p) => {
                          const isSel = secondaryProfession === p;
                          return (
                            <TouchableOpacity key={p} style={[styles.professionItem, { backgroundColor: isSel ? theme.primarySoft : theme.card, borderColor: isSel ? theme.primary : theme.border }]} onPress={() => setSecondaryProfession(p)} activeOpacity={0.7}>
                              <Text style={[typography.bodyMedium, { color: isSel ? theme.primary : theme.title, fontWeight: isSel ? '600' : '400' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                              {isSel && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>

                  {step === 2 && selectedProfession && (
                    <View style={styles.confirmBtnContainer}>
                      <TouchableOpacity onPress={() => setStep(3)} style={{ alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={[typography.bodySmall, { color: theme.primary }]}>+ Ajouter un domaine secondaire</Text>
                      </TouchableOpacity>
                      <Button title="Confirmer" onPress={handleConfirm} isLoading={isLoading} />
                    </View>
                  )}
                  {step === 4 && secondaryProfession && (
                    <View style={styles.confirmBtnContainer}>
                      <Button title="Confirmer" onPress={handleConfirm} isLoading={isLoading} />
                    </View>
                  )}
                </View>
              </BlurView>
            ) : (
              <View style={[styles.glassSheetWeb, { backgroundColor: isDark ? 'rgba(30,30,40,0.92)' : 'rgba(255,255,255,0.92)' }]}>
                <View style={[styles.glassSheetInner, { backgroundColor: isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                  <View style={styles.handle} />
                  
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    {step > 1 && (
                      <TouchableOpacity onPress={() => setStep(step === 4 ? 3 : step === 3 ? 2 : 1)} style={styles.modalBackBtn}>
                        <Ionicons name="chevron-back" size={24} color={theme.title} />
                      </TouchableOpacity>
                    )}
                    <Text style={[typography.h2, { color: theme.title, flex: 1 }]}>
                      {step === 1 ? 'Catégorie principale' : step === 2 ? 'Profession principale' : step === 3 ? 'Catégorie secondaire' : 'Profession secondaire'}
                    </Text>
                  </View>

                  <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                    {step === 1 && (
                      <View style={styles.grid}>
                        {Object.entries(CATEGORY_NAMES).map(([catId, catName]) => {
                          const isSelected = selectedCategory === catId;
                          return (
                            <TouchableOpacity key={catId} style={[styles.categoryCard, { backgroundColor: isSelected ? theme.primarySoft : theme.card, borderColor: isSelected ? theme.primary : theme.border }]} onPress={() => handleCategorySelect(catId)} activeOpacity={0.7}>
                              <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={24} color={isSelected ? theme.primary : theme.textSecondary} />
                              <Text style={[typography.labelSmall, { color: isSelected ? theme.primary : theme.title, marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>{catName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 2 && selectedCategory && (
                      <View style={styles.professionList}>
                        {(CATEGORY_SUBCATEGORIES[selectedCategory] || []).map((p) => {
                          const isSel = selectedProfession === p;
                          return (
                            <TouchableOpacity key={p} style={[styles.professionItem, { backgroundColor: isSel ? theme.primarySoft : theme.card, borderColor: isSel ? theme.primary : theme.border }]} onPress={() => setSelectedProfession(p)} activeOpacity={0.7}>
                              <Text style={[typography.bodyMedium, { color: isSel ? theme.primary : theme.title, fontWeight: isSel ? '600' : '400' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                              {isSel && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 3 && (
                      <View style={styles.grid}>
                        {Object.entries(CATEGORY_NAMES).filter(([c]) => c !== selectedCategory).map(([catId, catName]) => {
                          const isSelected = secondaryCategory === catId;
                          return (
                            <TouchableOpacity key={catId} style={[styles.categoryCard, { backgroundColor: isSelected ? theme.primarySoft : theme.card, borderColor: isSelected ? theme.primary : theme.border }]} onPress={() => { setSecondaryCategory(catId); setSecondaryProfession(null); setStep(4); }} activeOpacity={0.7}>
                              <Ionicons name={(CATEGORY_ICONS[catId] || 'grid') as any} size={24} color={isSelected ? theme.primary : theme.textSecondary} />
                              <Text style={[typography.labelSmall, { color: isSelected ? theme.primary : theme.title, marginTop: spacing.xs, textAlign: 'center' }]} numberOfLines={2}>{catName}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                    {step === 4 && secondaryCategory && (
                      <View style={styles.professionList}>
                        {(CATEGORY_SUBCATEGORIES[secondaryCategory] || []).map((p) => {
                          const isSel = secondaryProfession === p;
                          return (
                            <TouchableOpacity key={p} style={[styles.professionItem, { backgroundColor: isSel ? theme.primarySoft : theme.card, borderColor: isSel ? theme.primary : theme.border }]} onPress={() => setSecondaryProfession(p)} activeOpacity={0.7}>
                              <Text style={[typography.bodyMedium, { color: isSel ? theme.primary : theme.title, fontWeight: isSel ? '600' : '400' }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                              {isSel && <Ionicons name="checkmark-circle" size={22} color={theme.primary} />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>

                  {step === 2 && selectedProfession && (
                    <View style={styles.confirmBtnContainer}>
                      <TouchableOpacity onPress={() => setStep(3)} style={{ alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={[typography.bodySmall, { color: theme.primary }]}>+ Ajouter un domaine secondaire</Text>
                      </TouchableOpacity>
                      <Button title="Confirmer" onPress={handleConfirm} isLoading={isLoading} />
                    </View>
                  )}
                  {step === 4 && secondaryProfession && (
                    <View style={styles.confirmBtnContainer}>
                      <Button title="Confirmer" onPress={handleConfirm} isLoading={isLoading} />
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Organization Modal */}
      <Modal visible={showOrganizationModal} transparent animationType="fade" onRequestClose={() => setShowOrganizationModal(false)}>
        <View style={styles.glassOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowOrganizationModal(false)}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.32)']}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </TouchableOpacity>
          <View style={[styles.orgModalContent, { backgroundColor: theme.card }]}>
            <View style={styles.handle} />
            <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>Organisation</Text>
            <TextInput
              style={[styles.orgInput, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
              value={organizationInput}
              onChangeText={setOrganizationInput}
              placeholder="Nom de l'organisation"
              placeholderTextColor={theme.textSecondary}
            />
            <Button title="Enregistrer" onPress={handleSaveOrganization} isLoading={isLoading} style={{ marginTop: spacing.lg }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: 40 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 0.5,
  },
  orgModalContent: {
    padding: spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  orgInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  // Modal styles
  glassOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  glassModalContainer: {
    position: 'relative',
    maxHeight: '85%',
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
  },
  glassSheetWeb: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
    borderBottomWidth: 0,
    // @ts-ignore
    backdropFilter: 'blur(32px) saturate(180%)',
    WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  },
  glassSheetInner: {
    padding: spacing.xl,
    paddingBottom: 44,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalBackBtn: {
    marginRight: spacing.sm,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.sm,
  },
  categoryCard: {
    width: '30%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  professionList: { 
    gap: spacing.sm,
  },
  professionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  confirmBtnContainer: {
    marginTop: spacing.lg,
  },
});
