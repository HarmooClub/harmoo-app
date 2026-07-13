import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { lightTheme, darkTheme, type ThemeColors } from '../theme';

// Re-export for backward compat
export const colors = {
  primary: '#DC1B78',
  secondary: '#1DB7F8',
  background: '#F9FAFB',
  backgroundDark: '#0F0F14',
  title: '#111827',
  titleDark: '#F5F5FA',
  text: '#4B5563',
  textDark: '#E0E0E8',
  card: '#FFFFFF',
  cardDark: '#1A1A24',
  border: '#E5E7EB',
  borderDark: '#2A2A38',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  // Listen to system theme changes in real-time
  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  // Also listen to Appearance changes (for iOS Control Center)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  // Keep toggleTheme for manual override if needed
  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
