import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { servicesApi, usersApi } from '../../src/services/api';
import { spacing, shadows } from '../../src/theme';

const CONTACT_EMAIL = 'harmoo.app@gmail.com';
const CONTACT_PHONE = '33782183803'; // Format international pour WhatsApp

// Memoized service card for faster initial render
const ServiceCard = memo(({ service, freelancer, theme, getAvatarUrl }: any) => (
  <View style={[styles.serviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    {freelancer && (
      <View style={styles.freelancerRow}>
        <Image source={{ uri: getAvatarUrl(freelancer.id) }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.freelancerName, { color: theme.title }]}>{freelancer.full_name}</Text>
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={14} color="#3B82F6" />
            <Text style={styles.verifiedText}>Vérifié</Text>
          </View>
        </View>
      </View>
    )}
    <Text style={[styles.serviceTitle, { color: theme.title }]}>{service.title}</Text>
    {service.description && (
      <Text style={[styles.serviceDesc, { color: theme.textSecondary }]} numberOfLines={2}>{service.description}</Text>
    )}
    <View style={styles.priceRow}>
      <Text style={styles.price}>{service.price}€</Text>
      <Text style={[styles.duration, { color: theme.textSecondary }]}>
        {service.duration_hours ? `${service.duration_hours}h` : `${service.duration_minutes || 60}min`}
      </Text>
    </View>
  </View>
));

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [service, setService] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');

  useEffect(() => {
    if (serviceId) loadService();
  }, [serviceId]);

  useEffect(() => {
    if (user) {
      setName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const loadService = async () => {
    try {
      setIsLoading(true);
      const res = await servicesApi.getService(serviceId as string);
      setService(res.data);
      if (res.data.freelancer_id) {
        const freelancerRes = await usersApi.getUser(res.data.freelancer_id);
        setFreelancer(freelancerRes.data);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible de charger le service');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatarUrl = (id: string) => {
    const base = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';
    return `${base}/api/avatar/${id}`;
  };

  const sendWhatsApp = () => {
    const text = `🎙️ *Demande de réservation - Harmoo Studio*\n\n` +
      `*Service:* ${service?.title}\n` +
      `*Prix:* ${service?.price}€\n` +
      `*Nom:* ${name}\n` +
      `*Email:* ${email}\n` +
      `*Date souhaitée:* ${preferredDate || 'À définir'}\n` +
      `*Message:* ${message || 'Aucun'}`;
    
    const url = `https://wa.me/${CONTACT_PHONE}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  const sendEmail = () => {
    const subject = `Réservation - ${service?.title}`;
    const body = `Bonjour,\n\nJe souhaite réserver une session.\n\n` +
      `Service: ${service?.title}\n` +
      `Prix: ${service?.price}€\n` +
      `Nom: ${name}\n` +
      `Email: ${email}\n` +
      `Date souhaitée: ${preferredDate || 'À définir'}\n\n` +
      `Message: ${message || 'Aucun'}\n\nCordialement`;
    
    Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Service non trouvé</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.title} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réserver</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Card */}
        <ServiceCard service={service} freelancer={freelancer} theme={theme} getAvatarUrl={getAvatarUrl} />

        {/* Contact Form */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formTitle, { color: theme.title }]}>Vos informations</Text>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={theme.textSecondary}
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            placeholderTextColor={theme.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
            value={preferredDate}
            onChangeText={setPreferredDate}
            placeholder="Date souhaitée (ex: Samedi 20 janvier)"
            placeholderTextColor={theme.textSecondary}
          />
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.inputBg, color: theme.title, borderColor: theme.border }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Message (optionnel)"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.whatsappBtn} onPress={sendWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#FFF" />
          <Text style={styles.whatsappText}>Réserver via WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.emailBtn, { borderColor: theme.border }]} onPress={sendEmail}>
          <Ionicons name="mail-outline" size={22} color={theme.title} />
          <Text style={[styles.emailText, { color: theme.title }]}>Envoyer par email</Text>
        </TouchableOpacity>

        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
          Nous vous répondrons rapidement pour confirmer votre créneau
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 40 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16, marginTop: 12 },
  backBtn: { backgroundColor: '#DC1B78', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 20 },
  backBtnText: { color: '#FFF', fontWeight: '600' },
  
  // Service Card
  serviceCard: { borderRadius: 16, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.md },
  freelancerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  freelancerName: { fontSize: 16, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { color: '#3B82F6', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  serviceTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  serviceDesc: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: 28, fontWeight: '800', color: '#DC1B78' },
  duration: { fontSize: 14 },
  
  // Form
  formCard: { borderRadius: 16, borderWidth: 1, padding: spacing.lg, marginBottom: spacing.xl, ...shadows.sm },
  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.lg },
  input: { borderWidth: 1, borderRadius: 12, padding: spacing.md, fontSize: 15, marginBottom: spacing.md },
  textArea: { borderWidth: 1, borderRadius: 12, padding: spacing.md, fontSize: 15, minHeight: 80 },
  
  // Buttons
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 16, borderRadius: 12, gap: 10, ...shadows.md },
  whatsappText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  emailBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingVertical: 16, borderRadius: 12, marginTop: spacing.md, gap: 10 },
  emailText: { fontSize: 16, fontWeight: '600' },
  noteText: { fontSize: 13, textAlign: 'center', marginTop: spacing.lg },
});
