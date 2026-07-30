import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { BurgerMenu } from '../src/components/BurgerMenu';
import { spacing, shadows } from '../src/theme';
import * as Clipboard from 'expo-clipboard';

const CONTACT_EMAIL = 'harmoo.app@gmail.com';
const CONTACT_PHONE = '0782183803';

export default function ContactScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copié !', `${label} copié dans le presse-papier`);
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const openPhone = () => {
    Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <BurgerMenu />
        <Text style={styles.headerTitle}>Contact</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
            <Ionicons name="mail-outline" size={40} color="#3B82F6" />
          </View>
          <Text style={[styles.heroTitle, { color: theme.title }]}>Contactez-nous</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            Une question ? Une suggestion ? N'hésitez pas !
          </Text>
        </View>

        {/* Email Card */}
        <TouchableOpacity 
          style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={openEmail}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIcon, { backgroundColor: 'rgba(220,27,120,0.15)' }]}>
            <Ionicons name="mail" size={24} color="#DC1B78" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.contactValue, { color: theme.title }]}>{CONTACT_EMAIL}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.copyBtn, { backgroundColor: theme.border }]} 
            onPress={() => copyToClipboard(CONTACT_EMAIL, 'Email')}
          >
            <Ionicons name="copy-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Phone Card */}
        <TouchableOpacity 
          style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={openPhone}
          activeOpacity={0.8}
        >
          <View style={[styles.contactIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
            <Ionicons name="call" size={24} color="#10B981" />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>Téléphone</Text>
            <Text style={[styles.contactValue, { color: theme.title }]}>{CONTACT_PHONE}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.copyBtn, { backgroundColor: theme.border }]} 
            onPress={() => copyToClipboard(CONTACT_PHONE, 'Téléphone')}
          >
            <Ionicons name="copy-outline" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={openEmail}>
            <Ionicons name="send" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Envoyer un email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtnOutline, { borderColor: theme.border }]} 
            onPress={openPhone}
          >
            <Ionicons name="call" size={20} color={theme.title} />
            <Text style={[styles.actionBtnOutlineText, { color: theme.title }]}>Appeler</Text>
          </TouchableOpacity>
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
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 26, fontWeight: '700', marginTop: spacing.lg, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  contactCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 1, marginBottom: spacing.md, ...shadows.sm },
  contactIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: spacing.md },
  contactLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  copyBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionsContainer: { marginTop: spacing.xl, gap: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC1B78', paddingVertical: 16, borderRadius: 12, gap: 8, ...shadows.glow },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionBtnOutline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingVertical: 16, borderRadius: 12, gap: 8 },
  actionBtnOutlineText: { fontSize: 16, fontWeight: '600' },
});
