import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';

/**
 * Shared palette (receipts, PDFs, screens that need static colors).
 * Matches the original Food Receipt app theme before SlipGo blue.
 */
export const appPalette = {
  primary: '#E86A2B',
  secondary: '#F4A261',
  tertiary: '#2A9D8F',
  background: '#F8F4F0',
  surface: '#FFFFFF',
  /** Main text on light backgrounds */
  onSurface: '#1C1917',
  onSurfaceMuted: '#5C5652',
  borderSoft: '#E8E0D8',
} as const;

/** @deprecated Use appPalette — kept for components that imported slipgoColors */
export const slipgoColors = {
  slipgoBlue: appPalette.primary,
  deepNavy: appPalette.onSurface,
  mintGreen: appPalette.tertiary,
  softGray: appPalette.background,
  receiptWhite: appPalette.surface,
};

export const slipgoLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: appPalette.primary,
    secondary: appPalette.secondary,
    tertiary: appPalette.tertiary,
    surface: appPalette.surface,
    background: appPalette.background,
    onPrimary: '#FFFFFF',
    onSurface: appPalette.onSurface,
    outline: appPalette.borderSoft,
  },
};

export const slipgoDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F4A261',
    secondary: '#E86A2B',
    tertiary: '#2A9D8F',
  },
};

export const slipgoTagline = 'Fast. Simple. Receipts.';
