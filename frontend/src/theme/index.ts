import { Platform } from 'react-native';

// ==================== COLOR PALETTE ====================
export const palette = {
  // Brand
  primary: '#DC1B78',
  primaryLight: '#F0408E',
  primaryDark: '#B8155F',
  primarySoft: '#DC1B7812',
  primaryMedium: '#DC1B7825',

  secondary: '#1DB7F8',
  secondaryLight: '#4EC9FA',
  secondaryDark: '#0E97D4',
  secondarySoft: '#1DB7F812',

  // Accent
  accent: '#E94560',
  accentSoft: '#E9456015',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic
  success: '#10B981',
  successSoft: '#10B98115',
  error: '#EF4444',
  errorSoft: '#EF444415',
  warning: '#F59E0B',
  warningSoft: '#F59E0B15',
  info: '#3B82F6',
  infoSoft: '#3B82F615',

  // Dark mode - Premium dark blue
  darkBg: '#0A0E1A',
  darkCard: '#121829',
  darkBorder: '#1E2A45',
  darkText: '#B8C0D2',
  darkTitle: '#FFFFFF',
};

// ==================== SPACING (8pt grid) ====================
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

// ==================== TYPOGRAPHY ====================
const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Display
  displayLarge: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },

  // Headings
  h1: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h2: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Labels
  labelLarge: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },

  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },

  // Tiny
  tiny: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
};

// ==================== BORDER RADIUS ====================
export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// ==================== SHADOWS ====================
export const shadows = {
  none: {},
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
    default: {
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    android: {
      elevation: 12,
    },
    default: {
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#DC1B78',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: '0 4px 20px rgba(220,27,120,0.3)',
    },
  }),
};

// ==================== LIGHT & DARK THEMES ====================
// Premium dark theme for both modes (as requested)
const premiumDark = {
  background: '#0A0E1A',
  card: '#121829',
  title: '#FFFFFF',
  text: '#B8C0D2',
  textSecondary: '#6B7A99',
  border: '#1E2A45',
  borderLight: '#151D30',
  primary: palette.primary,
  primarySoft: 'rgba(220,27,120,0.15)',
  secondary: '#3B82F6',
  secondarySoft: 'rgba(59,130,246,0.15)',
  success: palette.success,
  successSoft: palette.successSoft,
  error: palette.error,
  errorSoft: palette.errorSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
  accent: palette.accent,
  accentSoft: palette.accentSoft,
  overlay: 'rgba(0,0,0,0.7)',
  skeleton: '#1E2A45',
  divider: '#1E2A45',
  inputBg: '#121829',
};

export const lightTheme = premiumDark;
export const darkTheme = premiumDark;

export type ThemeColors = typeof lightTheme;
