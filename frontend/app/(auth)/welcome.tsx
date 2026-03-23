import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Button } from '../../src/components/Button';
import { spacing, typography, radius } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Logo / Branding */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={[typography.displayLarge, { color: theme.title, marginTop: spacing.xxl }]}>Harmoo</Text>
          <Text style={[typography.bodyMedium, { color: theme.text, marginTop: spacing.sm, textAlign: 'center' }]}>
            La communauté des créatifs indépendants
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <FeatureItem icon="✨" label="Découvrez des talents créatifs" theme={theme} />
          <FeatureItem icon="🎯" label="Réservez des services uniques" theme={theme} />
          <FeatureItem icon="🤝" label="Rejoignez une communauté passionnée" theme={theme} />
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonsSection}>
          <Button title="S'inscrire" onPress={() => router.push('/(auth)/register')} />
          <Button title="Se connecter" onPress={() => router.push('/(auth)/login')} variant="outline" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, label, theme }: { icon: string; label: string; theme: any }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[typography.bodySmall, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xxxl },
  logoSection: { alignItems: 'center', paddingTop: 40 },
  logoCircle: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  features: { gap: spacing.lg },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: { fontSize: 22 },
  buttonsSection: { gap: spacing.md },
});
