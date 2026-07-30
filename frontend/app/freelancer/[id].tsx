import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { freelancersApi } from '../../src/services/api';
import { Card } from '../../src/components/Card';
import { spacing, typography, radius } from '../../src/theme';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.4;

export default function FreelancerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { if (id) loadFreelancer(); }, [id]);

  const loadFreelancer = async () => {
    try {
      setIsLoading(true);
      const res = await freelancersApi.getFreelancer(id as string);
      setFreelancer(res.data);
    } catch (error) { 
      console.error('Failed to load freelancer:', error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!freelancer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[typography.h3, { color: theme.title }]}>Profil non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = freelancer.avatar;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Image */}
      <View style={styles.headerImage}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.profileImage} 
            contentFit="cover" 
            cachePolicy="memory-disk" 
            transition={300} 
          />
        ) : (
          <View style={[styles.profileImage, { backgroundColor: theme.primary + '20' }]}>
            <View style={styles.profilePlaceholder}>
              <Ionicons name="business" size={80} color={theme.primary} />
            </View>
          </View>
        )}
      </View>

      {/* Back Button */}
      <SafeAreaView style={styles.headerButtons} edges={['top']}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ height: HEADER_HEIGHT }} />

        <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>
          {/* Studio Info Card */}
          <Card style={styles.studioCard} padding={spacing.xl}>
            <Text style={[styles.studioTitle, { color: theme.title }]}>Harmoo Studio</Text>
            <Text style={[styles.studioSubtitle, { color: theme.primary }]}>Studio d'enregistrement</Text>
            
            {/* Address */}
            <View style={styles.addressContainer}>
              <Ionicons name="location" size={18} color={theme.textSecondary} />
              <Text style={[styles.addressText, { color: theme.text }]}>
                27 rue des marais, Le Mans 72000
              </Text>
            </View>
          </Card>

          {/* Services */}
          {freelancer.services?.length > 0 && (
            <Card style={styles.servicesCard} padding={spacing.xl}>
              <Text style={[styles.servicesTitle, { color: theme.title }]}>Nos Services</Text>
              
              {freelancer.services.map((service: any, idx: number) => (
                <TouchableOpacity
                  key={service.id || idx}
                  style={[styles.serviceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => Linking.openURL('https://calendar.app.google/7rokBLb3nA8ALS6h8')}
                  activeOpacity={0.7}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceTitle, { color: theme.title }]}>{service.title}</Text>
                    {service.description && (
                      <Text style={[styles.serviceDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.servicePriceContainer}>
                    <Text style={[styles.servicePrice, { color: theme.primary }]}>{service.price}€</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {/* Bottom CTA */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: theme.primary }]}
            onPress={() => Linking.openURL('https://calendar.app.google/7rokBLb3nA8ALS6h8')}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={styles.ctaText}>Réserver une session</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  center: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerImage: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    height: HEADER_HEIGHT, 
    zIndex: 0 
  },
  profileImage: { 
    width: '100%', 
    height: '100%' 
  },
  profilePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10,
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.sm,
  },
  headerBtn: {
    width: 42, 
    height: 42, 
    borderRadius: radius.lg,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  contentContainer: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -24,
    paddingTop: spacing.lg,
  },
  studioCard: { 
    marginHorizontal: spacing.xl,
    alignItems: 'center',
  },
  studioTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  studioSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  addressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  servicesCard: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  servicesTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  serviceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  servicePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
