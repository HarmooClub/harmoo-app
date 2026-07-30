import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { servicesApi, usersApi } from '../../src/services/api';
import { spacing, shadows } from '../../src/theme';

// Google Calendar link generator
function createGoogleCalendarLink(params: {
  title: string;
  description: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}) {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', params.title);
  url.searchParams.set('details', params.description);
  url.searchParams.set('dates', `${formatDate(params.startDate)}/${formatDate(params.endDate)}`);
  if (params.location) url.searchParams.set('location', params.location);
  
  return url.toString();
}

// Memoized service card
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

// Date picker component
const DateSelector = memo(({ selectedDate, onSelect, theme }: any) => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  const formatDay = (date: Date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };
  
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
      {dates.map((date, i) => {
        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
        return (
          <TouchableOpacity
            key={i}
            style={[styles.dateItem, isSelected && styles.dateItemSelected, { borderColor: isSelected ? '#DC1B78' : theme.border }]}
            onPress={() => onSelect(date)}
          >
            <Text style={[styles.dateDay, { color: isSelected ? '#DC1B78' : theme.textSecondary }]}>{formatDay(date)}</Text>
            <Text style={[styles.dateNum, { color: isSelected ? '#DC1B78' : theme.title }]}>{date.getDate()}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

// Time picker component  
const TimeSelector = memo(({ selectedTime, onSelect, theme }: any) => {
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  
  return (
    <View style={styles.timeGrid}>
      {times.map((time) => {
        const isSelected = selectedTime === time;
        return (
          <TouchableOpacity
            key={time}
            style={[styles.timeItem, isSelected && styles.timeItemSelected, { borderColor: isSelected ? '#DC1B78' : theme.border, backgroundColor: isSelected ? 'rgba(220,27,120,0.15)' : theme.card }]}
            onPress={() => onSelect(time)}
          >
            <Text style={[styles.timeText, { color: isSelected ? '#DC1B78' : theme.title }]}>{time}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [service, setService] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) loadService();
  }, [serviceId]);

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

  const openGoogleCalendar = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Sélection requise', 'Veuillez choisir une date et un horaire');
      return;
    }

    // Create start date
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    // Create end date (add service duration)
    const durationMinutes = service.duration_hours ? service.duration_hours * 60 : (service.duration_minutes || 60);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    const calendarUrl = createGoogleCalendarLink({
      title: `🎙️ ${service.title} - Harmoo Studio`,
      description: `Réservation Harmoo Studio\n\nService: ${service.title}\nPrix: ${service.price}€\nDurée: ${durationMinutes} min\n\nContact: harmoo.app@gmail.com\nTél: 07 82 18 38 03`,
      location: 'Harmoo Studio',
      startDate,
      endDate,
    });

    Linking.openURL(calendarUrl);
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

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.title }]}>Choisir une date</Text>
          <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} theme={theme} />
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.title }]}>Choisir un horaire</Text>
          <TimeSelector selectedTime={selectedTime} onSelect={setSelectedTime} theme={theme} />
        </View>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar" size={24} color="#DC1B78" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.summaryTitle, { color: theme.title }]}>Votre réservation</Text>
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedTime}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.googleBtn, (!selectedDate || !selectedTime) && styles.googleBtnDisabled]} 
          onPress={openGoogleCalendar}
          disabled={!selectedDate || !selectedTime}
        >
          <Ionicons name="calendar" size={22} color="#FFF" />
          <Text style={styles.googleBtnText}>Ajouter à Google Calendar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: 120 },
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
  
  // Sections
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  
  // Date selector
  dateScroll: { gap: 10 },
  dateItem: { width: 56, height: 72, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dateItemSelected: { borderWidth: 2, backgroundColor: 'rgba(220,27,120,0.1)' },
  dateDay: { fontSize: 12, fontWeight: '500' },
  dateNum: { fontSize: 20, fontWeight: '700', marginTop: 2 },
  
  // Time selector
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeItem: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  timeItemSelected: { borderWidth: 2 },
  timeText: { fontSize: 15, fontWeight: '600' },
  
  // Summary
  summaryCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 16, borderWidth: 1, ...shadows.sm },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  summaryText: { fontSize: 14, marginTop: 2 },
  
  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, borderTopWidth: 1, paddingBottom: 34 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4285F4', paddingVertical: 16, borderRadius: 12, gap: 10, ...shadows.md },
  googleBtnDisabled: { backgroundColor: '#4285F480' },
  googleBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
