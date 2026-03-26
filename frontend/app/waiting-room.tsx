import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const LAUNCH_DATE = new Date('2026-04-08T18:00:00');
const ADMIN_EMAIL = 'alvin.m11@yahoo.com';

export default function WaitingRoomScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Admin bypass
    if (user?.email === ADMIN_EMAIL) {
      router.replace('/(tabs)');
      return;
    }

    // Check if launch date passed
    if (new Date() >= LAUNCH_DATE) {
      router.replace('/(tabs)');
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(timer);
        router.replace('/(tabs)');
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <View style={styles.timeBlock}>
      <View style={styles.timeValue}>
        <Text style={styles.timeNumber}>{String(value).padStart(2, '0')}</Text>
      </View>
      <Text style={styles.timeLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a2e', '#DC1B78']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>HARMOO</Text>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          <Text style={styles.comingSoon}>BIENTÔT DISPONIBLE</Text>
          
          <Text style={styles.title}>
            Prépare-toi à{'\n'}
            <Text style={styles.titleHighlight}>créer sans limites</Text>
          </Text>

          <Text style={styles.subtitle}>
            La plateforme qui connecte les créatifs ouvre ses portes le 8 avril à 18h
          </Text>

          {/* Countdown */}
          <View style={styles.countdown}>
            <TimeBlock value={timeLeft.days} label="JOURS" />
            <Text style={styles.separator}>:</Text>
            <TimeBlock value={timeLeft.hours} label="HEURES" />
            <Text style={styles.separator}>:</Text>
            <TimeBlock value={timeLeft.minutes} label="MIN" />
            <Text style={styles.separator}>:</Text>
            <TimeBlock value={timeLeft.seconds} label="SEC" />
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Ton profil est prêt ! Tu pourras le compléter à la date d'ouverture.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tu fais partie des premiers. Ça compte.
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
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 8,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC1B78',
    letterSpacing: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
  },
  titleHighlight: {
    fontWeight: '800',
    color: '#DC1B78',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 40,
    lineHeight: 24,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  timeBlock: {
    alignItems: 'center',
  },
  timeValue: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  timeNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    letterSpacing: 1,
  },
  separator: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 27, 120, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(220, 27, 120, 0.3)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
});
