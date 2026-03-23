import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, radius } from '../theme';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  large?: boolean;
}

export function ScreenHeader({
  title,
  showBack = true,
  onBack,
  rightAction,
  style,
  large = false,
}: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <View style={[styles.container, style]}>
      {showBack ? (
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: theme.card }]}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.title} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text
        style={[
          large ? styles.titleLarge : styles.title,
          { color: theme.title },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightAction ? rightAction : <View style={styles.placeholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  title: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
  },
  titleLarge: {
    ...typography.h1,
    flex: 1,
    textAlign: 'center',
  },
});
