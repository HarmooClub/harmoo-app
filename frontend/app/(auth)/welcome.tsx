import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { spacing, radius } from '../../src/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

        <SafeAreaView style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>HARMOO</Text>
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
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryButtonText}>Se connecter</Text>
            </TouchableOpacity>

            <Text style={styles.termsText}>
              En continuant, tu acceptes nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          </View>
        </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 8,
  },
  main: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  taglineHighlight: {
    fontSize: 38,
    fontWeight: '800',
    color: '#DC1B78',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 4,
  },
  valueProposition: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
    fontWeight: '400',
  },
  buttonsContainer: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 30,
  },
  primaryButton: {
    backgroundColor: '#DC1B78',
    paddingVertical: 16,
    borderRadius: radius.xl,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
});
