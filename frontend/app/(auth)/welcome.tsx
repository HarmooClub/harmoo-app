import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { spacing, shadows } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0E1A', '#121829', '#0A0E1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/harmoo-logo.png')} style={styles.logo} contentFit="contain" />
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          <Text style={styles.tagline}>RECRÉE LES</Text>
          <Text style={styles.taglineHighlight}>RÈGLES DU JEU</Text>
          
          <Text style={styles.valueProposition}>
            Rencontre des créatifs avec qui{'\n'}réaliser ton projet près de chez toi
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Créer un compte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Se connecter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Explorer sans compte</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  logoContainer: { alignItems: 'center', marginTop: height * 0.08 },
  logo: { width: 180, height: 40 },
  main: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tagline: { fontSize: 32, fontWeight: '300', color: '#FFF', letterSpacing: 4, textAlign: 'center' },
  taglineHighlight: { fontSize: 36, fontWeight: '800', color: '#DC1B78', letterSpacing: 2, marginTop: 4, textAlign: 'center' },
  valueProposition: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 32, lineHeight: 26 },
  buttonsContainer: { paddingBottom: spacing.xxl, gap: 14 },
  primaryButton: { backgroundColor: '#DC1B78', paddingVertical: 18, borderRadius: 14, alignItems: 'center', ...shadows.glow },
  primaryButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  skipButton: { paddingVertical: 14, alignItems: 'center' },
  skipButtonText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '500' },
});
