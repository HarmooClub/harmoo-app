import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { palette, radius } from '../theme';

// Color palette for default avatars based on initials
const AVATAR_COLORS = [
  '#DC1B78', '#1DB7F8', '#10B981', '#F59E0B', '#8B5CF6',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://harmoo-backen.onrender.com';

export function getAvatarUrl(avatar?: string | null, name?: string): string | null {
  if (avatar && avatar.startsWith('http')) return avatar;
  if (avatar && avatar.startsWith('data:')) return avatar;
  // Avatar URL from API (relative path like /api/avatar/xxx)
  if (avatar && avatar.startsWith('/api/avatar/')) return `${API_URL}${avatar}`;
  // No avatar — return null to trigger initials display
  return null;
}

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  borderRadius?: number;
  onPress?: () => void;
  showEdit?: boolean;
  style?: any;
}

export function Avatar({
  uri,
  name = '',
  size = 48,
  borderRadius,
  onPress,
  showEdit = false,
  style,
}: AvatarProps) {
  const { theme } = useTheme();
  const resolvedUri = getAvatarUrl(uri, name);
  const br = borderRadius ?? size * 0.3;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bgColor = getColorFromName(name);

  const content = resolvedUri ? (
    <Image
      source={{ uri: resolvedUri }}
      style={[{ width: size, height: size, borderRadius: br }, style]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      recyclingKey={resolvedUri}
      placeholder={bgColor}
    />
  ) : (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: br,
          backgroundColor: bgColor + '20',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {initials ? (
        <Text
          style={{
            color: bgColor,
            fontSize: size * 0.35,
            fontWeight: '700',
          }}
        >
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.45} color={bgColor} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
        {showEdit && (
          <View
            style={[
              styles.editBadge,
              {
                backgroundColor: theme.primary,
                bottom: 0,
                right: 0,
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: size * 0.15,
              },
            ]}
          >
            <Ionicons name="camera" size={size * 0.16} color="#FFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  editBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
});
