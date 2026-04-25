import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Card } from '../src/components/Card';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Button } from '../src/components/Button';
import { spacing, typography, radius } from '../src/theme';
import api, { bankApi } from '../src/services/api';

const PAYOUT_INFO: Record<string, { delay: string; color: string }> = {
  'essentiel': { delay: 'Mensuel', color: '#6B7280' },
  'standard': { delay: 'Tous les 15 jours', color: '#DC1B78' },
  'business': { delay: 'Instantané', color: '#10B981' },
};

export default function CashRegisterScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isSavingBank, setIsSavingBank] = useState(false);

  const tier = user?.subscription_tier || 'essentiel';
  const payoutInfo = PAYOUT_INFO[tier] || PAYOUT_INFO.essentiel;

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      // Use individual try-catch to prevent one failure from blocking all data
      let cashData = null, bankData = null, withdrawData: any[] = [];
      
      try {
        const cashRes = await api.get('/cash-register');
        cashData = cashRes.data;
      } catch (e) {
        console.warn('Failed to load cash register:', e);
      }
      
      try {
        const bankRes = await bankApi.getBankDetails();
        bankData = bankRes.data;
      } catch (e) {
        console.warn('Failed to load bank details:', e);
      }
      
      try {
        const withdrawRes = await bankApi.getWithdrawals();
        withdrawData = withdrawRes.data;
      } catch (e) {
        console.warn('Failed to load withdrawals:', e);
      }
      
      setData(cashData);
      setBankDetails(bankData);
      setWithdrawals(withdrawData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      Alert.alert('Erreur', 'Montant minimum: 10€');
      return;
    }
    if (amount > (data?.available_amount || 0)) {
      Alert.alert('Erreur', 'Solde insuffisant');
      return;
    }
    if (!bankDetails?.iban) {
      Alert.alert('Erreur', 'Veuillez d\'abord ajouter vos coordonnées bancaires');
      setShowWithdrawModal(false);
      setShowBankModal(true);
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await bankApi.requestWithdrawal(amount);
      Alert.alert('Succès', `Retrait de ${amount}€ en cours. ${response.data.payout_schedule}`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchAll();
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors du retrait');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSaveBank = async () => {
    if (!iban || !bic || !accountHolder) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    setIsSavingBank(true);
    try {
      await bankApi.updateBankDetails({ iban: iban.trim(), bic: bic.trim(), account_holder: accountHolder.trim() });
      Alert.alert('Succès', 'Coordonnées bancaires enregistrées');
      setShowBankModal(false);
      fetchAll();
    } catch (error: any) {
      console.error('Bank save error:', error);
      Alert.alert('Erreur', error.response?.data?.detail || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSavingBank(false);
    }
  };

  const openBankModal = () => {
    // Pre-populate form with existing bank details
    if (bankDetails?.iban) {
      setIban(bankDetails.iban);
      setBic(bankDetails.bic || '');
      setAccountHolder(bankDetails.account_holder || '');
    } else {
      setIban('');
      setBic('');
      setAccountHolder('');
    }
    setShowBankModal(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ScreenHeader title="Caisse" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScreenHeader title="Caisse" />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
          <Text style={[typography.caption, { color: '#FFF', opacity: 0.7 }]}>Solde disponible</Text>
          <Text style={styles.balanceValue}>{(data?.available_amount || 0).toFixed(2)}€</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>En attente</Text>
              <Text style={styles.statValue}>{(data?.pending_amount || 0).toFixed(2)}€</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total gagné</Text>
              <Text style={styles.statValue}>{(data?.total_amount || 0).toFixed(2)}€</Text>
            </View>
          </View>

          {/* Payout schedule badge */}
          <View style={[styles.payoutBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="time-outline" size={14} color="#FFF" />
            <Text style={styles.payoutText}>Versement: {payoutInfo.delay}</Text>
          </View>

          <TouchableOpacity 
            style={styles.withdrawBtn} 
            onPress={() => setShowWithdrawModal(true)}
            disabled={(data?.available_amount || 0) < 10}
          >
            <Ionicons name="arrow-down-circle-outline" size={18} color="#FFF" />
            <Text style={[typography.labelMedium, { color: '#FFF', marginLeft: 6 }]}>Retirer</Text>
          </TouchableOpacity>
        </View>

        {/* Bank Details Card */}
        <Card style={styles.bankCard} padding={spacing.lg}>
          <View style={styles.bankHeader}>
            <Text style={[typography.h3, { color: theme.title }]}>Coordonnées bancaires</Text>
            <TouchableOpacity onPress={openBankModal}>
              <Ionicons name="create-outline" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
          {bankDetails?.iban ? (
            <View style={styles.bankInfo}>
              <View style={styles.bankRow}>
                <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>IBAN</Text>
                <Text style={[typography.labelMedium, { color: theme.title }]}>{bankDetails.iban_masked}</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>Titulaire</Text>
                <Text style={[typography.labelMedium, { color: theme.title }]}>{bankDetails.account_holder}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addBankBtn, { borderColor: theme.primary }]} onPress={openBankModal}>
              <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
              <Text style={[typography.labelMedium, { color: theme.primary }]}>Ajouter un compte bancaire</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Withdrawals History */}
        {withdrawals.length > 0 && (
          <Card style={styles.infoCard} padding={spacing.lg}>
            <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>Retraits en cours</Text>
            {withdrawals.map((w) => (
              <View key={w.id} style={[styles.withdrawalRow, { borderBottomColor: theme.divider }]}>
                <View style={[styles.withdrawalIcon, { backgroundColor: w.status === 'completed' ? theme.successSoft : theme.warningSoft }]}>
                  <Ionicons name={w.status === 'completed' ? 'checkmark' : 'time'} size={18} color={w.status === 'completed' ? theme.success : theme.warning} />
                </View>
                <View style={styles.withdrawalInfo}>
                  <Text style={[typography.labelMedium, { color: theme.title }]}>{w.amount.toFixed(2)}€</Text>
                  <Text style={[typography.tiny, { color: theme.textSecondary }]}>
                    {w.status === 'pending' ? `Arrivée prévue: ${formatDate(w.estimated_arrival)}` : 'Effectué'}
                  </Text>
                </View>
                <Text style={[typography.tiny, { color: theme.textSecondary }]}>****{w.bank_iban_last4}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Transactions List */}
        <Card style={styles.infoCard} padding={spacing.lg}>
          <Text style={[typography.h3, { color: theme.title, marginBottom: spacing.lg }]}>Historique des transactions</Text>
          
          {(!data?.entries || data.entries.length === 0) ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={40} color="#000000" />
              <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.md }]}>
                Aucune transaction pour le moment
              </Text>
            </View>
          ) : (
            data.entries.map((entry: any) => (
              <View key={entry.id} style={[styles.transactionRow, { borderBottomColor: theme.divider }]}>
                <View style={[styles.transactionIcon, { backgroundColor: theme.successSoft }]}>
                  <Ionicons name="arrow-down" size={18} color={theme.success} />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[typography.labelMedium, { color: theme.title }]}>Paiement reçu</Text>
                  <Text style={[typography.tiny, { color: theme.textSecondary }]}>{formatDate(entry.created_at)}</Text>
                </View>
                <View style={styles.transactionAmounts}>
                  <Text style={[typography.labelLarge, { color: theme.success }]}>+{entry.net_amount.toFixed(2)}€</Text>
                  <Text style={[typography.tiny, { color: theme.textSecondary }]}>
                    -{entry.commission.toFixed(2)}€ comm.
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="fade" onRequestClose={() => setShowWithdrawModal(false)}>
        <View style={styles.glassOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowWithdrawModal(false)}>
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.32)']} locations={[0, 1]} style={StyleSheet.absoluteFill} />
          </Pressable>
          <View style={[styles.glassModalContainer, { zIndex: 10, elevation: 10 }]}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']} locations={[0, 1]} style={styles.glassFeatherTop} />
            <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalInner, { backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
              <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.lg }]}>Retirer des fonds</Text>
              <Text style={[typography.bodySmall, { color: theme.textSecondary, marginBottom: spacing.lg }]}>
                Disponible: {(data?.available_amount || 0).toFixed(2)}€ • Min: 10€
              </Text>
              <TextInput
                style={[styles.amountInput, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="decimal-pad"
                placeholder="Montant en €"
                placeholderTextColor={theme.textSecondary}
              />
              <Button title="Retirer" onPress={handleWithdraw} isLoading={isWithdrawing} style={{ marginTop: spacing.xl }} />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal visible={showBankModal} transparent animationType="fade" onRequestClose={() => setShowBankModal(false)}>
        <View style={styles.glassOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowBankModal(false)}>
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.32)']} locations={[0, 1]} style={StyleSheet.absoluteFill} />
          </Pressable>
          <View style={[styles.glassModalContainer, { zIndex: 10, elevation: 10 }]}>
            <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']} locations={[0, 1]} style={styles.glassFeatherTop} />
            <Pressable onPress={(e) => e.stopPropagation()} style={[styles.modalInner, { backgroundColor: 'rgba(255,255,255,0.95)', borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
              <Text style={[typography.h2, { color: theme.title, marginBottom: spacing.xl }]}>Coordonnées bancaires</Text>
              
              <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm }]}>Titulaire du compte</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={accountHolder}
                onChangeText={setAccountHolder}
                placeholder="Jean Dupont"
                placeholderTextColor={theme.textSecondary}
              />
              
              <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm, marginTop: spacing.lg }]}>IBAN</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={iban}
                onChangeText={setIban}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
              
              <Text style={[typography.labelMedium, { color: theme.title, marginBottom: spacing.sm, marginTop: spacing.lg }]}>BIC/SWIFT</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.title, borderColor: theme.border }]}
                value={bic}
                onChangeText={setBic}
                placeholder="BNPAFRPP"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
              
              <Button title="Enregistrer" onPress={handleSaveBank} isLoading={isSavingBank} style={{ marginTop: spacing.xxl }} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.xl, paddingBottom: 40 },
  balanceCard: { borderRadius: radius.xl, padding: spacing.xxl, alignItems: 'center', marginBottom: spacing.xl },
  balanceValue: { fontSize: 40, fontWeight: '800', color: '#FFF', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#FFF', marginTop: 2 },
  statDivider: { width: 1, height: 30 },
  payoutBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: spacing.lg },
  payoutText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  withdrawBtn: { 
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: 12, 
    borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.2)' 
  },
  bankCard: { marginBottom: spacing.xl },
  bankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  bankInfo: { gap: spacing.sm },
  bankRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addBankBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderWidth: 1.5, borderRadius: radius.md, borderStyle: 'dashed' },
  infoCard: { marginBottom: spacing.xl },
  emptyHistory: { alignItems: 'center', paddingVertical: spacing.xxl },
  transactionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1, marginLeft: spacing.md },
  transactionAmounts: { alignItems: 'flex-end' },
  withdrawalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1 },
  withdrawalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  withdrawalInfo: { flex: 1, marginLeft: spacing.md },
  glassOverlay: { flex: 1, justifyContent: 'flex-end' },
  glassModalContainer: { position: 'relative' },
  glassFeatherTop: { position: 'absolute', top: -36, left: -12, right: -12, height: 44, borderTopLeftRadius: 36, borderTopRightRadius: 36, zIndex: 5 },
  glassSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  modalInner: { padding: spacing.xxl, paddingBottom: 44 },
  amountInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', paddingVertical: spacing.lg, borderWidth: 1, borderRadius: radius.md },
  input: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderWidth: 1, borderRadius: radius.md, fontSize: 16 },
});
