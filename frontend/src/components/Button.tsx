import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      case 'danger': return theme.error;
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#FFFFFF';
      case 'outline':
        return theme.primary;
      case 'ghost':
        return theme.primary;
      default:
        return '#FFFFFF';
    }
  };

  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, minHeight: 40 },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, minHeight: 48 },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxxl, minHeight: 56 },
  };

  const fontSizes = {
    small: typography.labelSmall,
    medium: typography.labelLarge,
    large: { ...typography.labelLarge, fontSize: 17 },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        sizeStyles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outline' ? theme.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1.5 : 0,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              fontSizes[size],
              {
                color: getTextColor(),
                marginLeft: icon ? spacing.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
});
