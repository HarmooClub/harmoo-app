import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { spacing, typography, radius } from '../../src/theme';

// Storage helper
const store = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
};

interface SavedAccount {
  email: string;
  password: string;
  full_name: string;
  avatar?: string;
}

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => { loadSavedAccounts(); }, []);

  const loadSavedAccounts = async () => {
    try {
      const raw = await store.getItem('saved_accounts');
      if (raw) setSavedAccounts(JSON.parse(raw));
    } catch {}
  };

  const saveAccount = async (acct: SavedAccount) => {
    try {
      const raw = await store.getItem('saved_accounts');
      let accounts: SavedAccount[] = raw ? JSON.parse(raw) : [];
      // Update or add
      const idx = accounts.findIndex(a => a.email === acct.email);
      if (idx >= 0) accounts[idx] = acct;
      else accounts.push(acct);
      // Keep max 5
      if (accounts.length > 5) accounts = accounts.slice(-5);
      await store.setItem('saved_accounts', JSON.stringify(accounts));
      setSavedAccounts(accounts);
    } catch {}
  };

  const removeSavedAccount = async (emailToRemove: string) => {
    try {
      const updated = savedAccounts.filter(a => a.email !== emailToRemove);
      await store.setItem('saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch {}
  };

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const e = loginEmail || email.trim();
    const p = loginPassword || password.trim();
    if (!e || !p) { setError('Veuillez remplir tous les champs'); return; }
    setIsLoading(true);
    setError('');
    try {
      await login(e, p);
      if (rememberMe) {
        // Get fresh user data after login
        const raw = await store.getItem('user');
        const userData = raw ? JSON.parse(raw) : {};
        await saveAccount({ email: e, password: p, full_name: userData.full_name || e, avatar: userData.avatar });
      }
      router.replace('/waiting-room');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Identifiants incorrects');
    } finally { setIsLoading(false); }
  };

  const quickLogin = (acct: SavedAccount) => {
    setEmail(acct.email);
    setPassword(acct.password);
    handleLogin(acct.email, acct.password);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <View style={[styles.backIcon, { backgroundColor: theme.card }]}>
              <Ionicons name="chevron-back" size={20} color={theme.title} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={[typography.displayMedium, { color: theme.title }]}>Bon retour !</Text>
            <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.sm }]}>
              Connectez-vous à votre compte
            </Text>
          </View>

          {/* Saved Accounts */}
          {savedAccounts.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={[typography.labelMedium, { color: theme.textSecondary, marginBottom: spacing.md }]}>
                COMPTES MÉMORISÉS
              </Text>
              {savedAccounts.map((acct) => (
                <TouchableOpacity
                  key={acct.email}
                  style={[styles.savedCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => quickLogin(acct)}
                  activeOpacity={0.7}
                >
                  <Avatar uri={acct.avatar} name={acct.full_name} size={40} borderRadius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.labelLarge, { color: theme.title }]} numberOfLines={1}>{acct.full_name}</Text>
                    <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>{acct.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); removeSavedAccount(acct.email); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <View style={[styles.divider, { backgroundColor: theme.divider }]}>
                <Text style={[typography.caption, { color: theme.textSecondary, backgroundColor: theme.background, paddingHorizontal: spacing.md }]}>
                  ou connectez-vous manuellement
                </Text>
              </View>
            </View>
          )}

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
              <Text style={[typography.bodySmall, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          <Input label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com" keyboardType="email-address" icon="mail-outline" />
          <Input label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Votre mot de passe" secureTextEntry icon="lock-closed-outline" />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={{ alignSelf: 'flex-end', marginTop: spacing.sm }}>
            <Text style={[typography.labelMedium, { color: theme.primary }]}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          {/* Remember me checkbox */}
          <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, { borderColor: rememberMe ? theme.primary : theme.border, backgroundColor: rememberMe ? theme.primary : 'transparent' }]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <Text style={[typography.bodySmall, { color: theme.text }]}>Mémoriser ce compte</Text>
          </TouchableOpacity>

          <Button title="Se connecter" onPress={() => handleLogin()} isLoading={isLoading} style={{ marginTop: spacing.md }} />

          <View style={styles.footer}>
            <Text style={[typography.bodySmall, { color: theme.text }]}>Pas encore de compte ?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[typography.labelLarge, { color: theme.primary, marginLeft: spacing.xs }]}>S'inscrire</Text>
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
  headerSection: { marginBottom: spacing.xl },
  savedSection: { marginBottom: spacing.xl },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xxl },
});
