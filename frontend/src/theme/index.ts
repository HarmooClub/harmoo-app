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

  // Dark mode
  darkBg: '#0F0F14',
  darkCard: '#1A1A24',
  darkBorder: '#2A2A38',
  darkText: '#E0E0E8',
  darkTitle: '#F5F5FA',
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
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

// ==================== LIGHT & DARK THEMES ====================
export const lightTheme = {
  background: palette.gray50,
  card: palette.white,
  title: palette.gray900,
  text: palette.gray600,
  textSecondary: palette.gray400,
  border: palette.gray200,
  borderLight: palette.gray100,
  primary: palette.primary,
  primarySoft: palette.primarySoft,
  secondary: palette.secondary,
  secondarySoft: palette.secondarySoft,
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
  overlay: 'rgba(0,0,0,0.4)',
  skeleton: palette.gray200,
  divider: palette.gray100,
  inputBg: palette.white,
};

export const darkTheme = {
  background: palette.darkBg,
  card: palette.darkCard,
  title: palette.darkTitle,
  text: palette.darkText,
  textSecondary: palette.gray500,
  border: palette.darkBorder,
  borderLight: '#1E1E2A',
  primary: palette.primary,
  primarySoft: palette.primarySoft,
  secondary: palette.secondary,
  secondarySoft: palette.secondarySoft,
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
  overlay: 'rgba(0,0,0,0.6)',
  skeleton: palette.darkBorder,
  divider: palette.darkBorder,
  inputBg: palette.darkCard,
};

export type ThemeColors = typeof lightTheme;
