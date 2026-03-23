import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { palette, radius, spacing, typography } from '../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'accent' | 'club' | 'member';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'small' | 'medium';
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: palette.primarySoft, text: palette.primary },
  secondary: { bg: palette.secondarySoft, text: palette.secondary },
  success: { bg: palette.successSoft, text: palette.success },
  error: { bg: palette.errorSoft, text: palette.error },
  warning: { bg: palette.warningSoft, text: palette.warning },
  info: { bg: palette.infoSoft, text: palette.info },
  accent: { bg: palette.accentSoft, text: palette.accent },
  club: { bg: '#1DB7F8', text: '#FFFFFF' },
  member: { bg: '#10B981', text: '#FFFFFF' },
};

export function Badge({ label, variant = 'primary', icon, size = 'small' }: BadgeProps) {
  const config = variantConfig[variant];
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={isSmall ? 10 : 13}
          color={config.text}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          isSmall ? styles.textSmall : styles.textMedium,
          { color: config.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
  },
  textSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  textMedium: {
    fontSize: 13,
    fontWeight: '600',
  },
});
