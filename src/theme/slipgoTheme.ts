import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';

/** SlipGo brand — Inter/Poppins can replace system fonts when linked in assets. */
export const slipgoColors = {
  slipgoBlue: '#2D8CFF',
  deepNavy: '#0A1A2F',
  mintGreen: '#4BE4C9',
  softGray: '#E8ECF1',
  receiptWhite: '#FFFFFF',
};

export const slipgoLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: slipgoColors.slipgoBlue,
    primaryContainer: '#C5E4FF',
    secondary: slipgoColors.mintGreen,
    secondaryContainer: '#C8FFF6',
    tertiary: slipgoColors.deepNavy,
    surface: slipgoColors.receiptWhite,
    surfaceVariant: slipgoColors.softGray,
    background: slipgoColors.softGray,
    onPrimary: '#FFFFFF',
    onSecondary: slipgoColors.deepNavy,
    onSurface: slipgoColors.deepNavy,
    outline: '#B8C4D4',
  },
};

export const slipgoDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: slipgoColors.slipgoBlue,
    primaryContainer: '#1E4A7A',
    secondary: slipgoColors.mintGreen,
    tertiary: slipgoColors.softGray,
    background: slipgoColors.deepNavy,
    surface: '#122436',
    onPrimary: '#FFFFFF',
    onSurface: slipgoColors.softGray,
  },
};

export const slipgoTagline = 'Fast. Simple. Receipts.';
