import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface FreelancerCardProps {
  freelancer: {
    id: string;
    full_name: string;
    avatar?: string;
    categories?: string[];
    hourly_rate?: number;
    rating?: number;
    reviews_count?: number;
    is_harmoo_club?: boolean;
    distance_km?: number;
    travel_minutes?: number;
    city?: string;
  };
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function FreelancerCard({ freelancer, onFavorite, isFavorite }: FreelancerCardProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => router.push(`/freelancer/${freelancer.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {freelancer.avatar ? (
          <Image
            source={{ uri: freelancer.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
            <Ionicons name="person" size={32} color={theme.text} />
          </View>
        )}
        {freelancer.is_harmoo_club && (
          <View style={[styles.badge, { backgroundColor: '#1DB7F8' }]}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
          </View>
        )}
        {onFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavorite}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? theme.primary : theme.text}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.title }]} numberOfLines={1}>
          {freelancer.full_name}
        </Text>

        {freelancer.categories && freelancer.categories.length > 0 && (
          <Text style={[styles.category, { color: theme.text }]} numberOfLines={1}>
            {freelancer.categories[0]}
          </Text>
        )}

        <View style={styles.row}>
          {freelancer.rating !== undefined && freelancer.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={[styles.rating, { color: theme.text }]}>
                {freelancer.rating.toFixed(1)}
              </Text>
              <Text style={[styles.reviews, { color: theme.border }]}>
                ({freelancer.reviews_count})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {freelancer.hourly_rate && (
            <Text style={[styles.price, { color: theme.primary }]}>
              {freelancer.hourly_rate}€/h
            </Text>
          )}
          {freelancer.travel_minutes !== undefined && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={12} color={theme.secondary} />
              <Text style={[styles.distance, { color: theme.secondary }]}>
                {freelancer.travel_minutes} min
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Montserrat',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    marginBottom: 8,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Montserrat',
  },
  reviews: {
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Montserrat',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Montserrat',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distance: {
    fontSize: 10,
    marginLeft: 2,
    fontFamily: 'Montserrat',
  },
});
