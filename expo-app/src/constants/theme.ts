/**
 * CupMap Design System
 *
 * Premium dark-first palette with warm food-themed accent colors.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    background: '#FFF8F0',
    backgroundElement: '#FFF0E0',
    backgroundSelected: '#FFE4CC',
    card: '#FFFFFF',
    accent: '#E85D26',
    accentSoft: '#FFF0E8',
    accentGlow: 'rgba(232, 93, 38, 0.25)',
    success: '#22C55E',
    border: '#F0E6DA',
    starFilled: '#FBBF24',
    starEmpty: '#E5E7EB',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    background: '#0D0D0D',
    backgroundElement: '#1A1A1F',
    backgroundSelected: '#2A2A30',
    card: '#161618',
    accent: '#FF6B35',
    accentSoft: '#1F1410',
    accentGlow: 'rgba(255, 107, 53, 0.3)',
    success: '#34D399',
    border: '#2A2A2E',
    starFilled: '#FBBF24',
    starEmpty: '#374151',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
