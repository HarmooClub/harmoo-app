import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface CategoryChipProps {
  name: string;
  icon?: string;
  isSelected?: boolean;
  onPress?: () => void;
}

export function CategoryChip({ name, icon, isSelected, onPress }: CategoryChipProps) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.primary : theme.card,
          borderColor: isSelected ? theme.primary : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && (
        <Ionicons
          name={icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : theme.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: isSelected ? '#FFFFFF' : theme.text },
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Montserrat',
  },
});
