import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { spacing, typography, radius } from '../../src/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';

// Use same axios pattern as api.ts
import axios from 'axios';
const apiClient = axios.create({ baseURL: `${API_URL}/api` });

type Step = 'email' | 'code' | 'password';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const showMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert(title, msg);
  };

  const handleSendCode = async () => {
    if (!email.trim()) { setError('Entrez votre adresse email'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSimulatedCode(res.data.simulated_code || '');
      setStep('code');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erreur');
    } finally { setIsLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) { setError('Entrez le code reçu'); return; }
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/verify-reset-code', { email: email.trim(), code: code.trim() });
      setStep('password');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Code invalide');
    } finally { setIsLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError('Minimum 6 caractères'); return; }
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    setIsLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/reset-password', { email: email.trim(), code: code.trim(), new_password: newPassword });
      showMsg('Succès', 'Mot de passe modifié. Connectez-vous avec votre nouveau mot de passe.');
      router.replace('/(auth)/login');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Erreur');
    } finally { setIsLoading(false); }
  };

  const getTitle = () => {
    if (step === 'email') return 'Mot de passe oublié';
    if (step === 'code') return 'Vérification';
    return 'Nouveau mot de passe';
  };

  const getSubtitle = () => {
    if (step === 'email') return 'Entrez votre email pour recevoir un code de récupération';
    if (step === 'code') return `Un code a été envoyé à ${email}`;
    return 'Choisissez un nouveau mot de passe';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => step === 'email' ? router.back() : setStep(step === 'code' ? 'email' : 'code')} style={styles.backBtn}>
            <View style={[styles.backIcon, { backgroundColor: theme.card }]}>
              <Ionicons name="chevron-back" size={20} color={theme.title} />
            </View>
          </TouchableOpacity>

          {/* Step indicator */}
          <View style={styles.stepRow}>
            {['email', 'code', 'password'].map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <View style={[styles.stepLine, { backgroundColor: ['code','password'].indexOf(step) >= i ? theme.primary : theme.border }]} />}
                <View style={[styles.stepDot, { backgroundColor: ['email','code','password'].indexOf(step) >= i ? theme.primary : theme.border }]}>
                  {['email','code','password'].indexOf(step) > i ? (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  ) : (
                    <Text style={{ color: ['email','code','password'].indexOf(step) >= i ? '#FFF' : theme.textSecondary, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  )}
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.headerSection}>
            <Text style={[typography.displayMedium, { color: theme.title }]}>{getTitle()}</Text>
            <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.sm }]}>{getSubtitle()}</Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: theme.errorSoft }]}>
              <Text style={[typography.bodySmall, { color: theme.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1: Email */}
          {step === 'email' && (
            <View>
              <Input label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com" keyboardType="email-address" icon="mail-outline" />
              <Button title="Envoyer le code" onPress={handleSendCode} isLoading={isLoading} style={{ marginTop: spacing.lg }} />
            </View>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <View>
              {/* Show simulated code for development */}
              {simulatedCode ? (
                <View style={[styles.simulatedBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '30' }]}>
                  <Ionicons name="information-circle" size={18} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.caption, { color: theme.primary }]}>Code simulé (développement)</Text>
                    <Text style={[typography.displaySmall, { color: theme.primary, letterSpacing: 4 }]}>{simulatedCode}</Text>
                  </View>
                </View>
              ) : null}

              <Input label="Code de vérification" value={code} onChangeText={setCode} placeholder="123456" keyboardType="number-pad" icon="key-outline" maxLength={6} />
              <Button title="Vérifier le code" onPress={handleVerifyCode} isLoading={isLoading} style={{ marginTop: spacing.lg }} />

              <TouchableOpacity onPress={handleSendCode} style={{ alignItems: 'center', marginTop: spacing.xl }}>
                <Text style={[typography.labelMedium, { color: theme.primary }]}>Renvoyer le code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: New password */}
          {step === 'password' && (
            <View>
              <Input label="Nouveau mot de passe" value={newPassword} onChangeText={setNewPassword} placeholder="Minimum 6 caractères" secureTextEntry icon="lock-closed-outline" />
              <Input label="Confirmer" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmez le mot de passe" secureTextEntry icon="lock-closed-outline" />
              <Button title="Modifier le mot de passe" onPress={handleResetPassword} isLoading={isLoading} style={{ marginTop: spacing.lg }} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: 40 },
  backBtn: { marginBottom: spacing.md },
  backIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepLine: { height: 2, width: 40 },
  headerSection: { marginBottom: spacing.xl },
  errorBox: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  simulatedBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.xl,
  },
});
