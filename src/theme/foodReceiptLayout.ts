import type {TextStyle, ViewStyle} from 'react-native';

/**
 * Layout & component tokens matching the original Food Receipt app
 * (warm background, white elevated cards, compact tab bar).
 */
export const foodReceiptLayout = {
  screenPadding: 16,
  cardRadius: 12,
  cardMarginH: 12,
  cardMarginV: 6,
  fabOffsetBottom: 80,
  tabBarHeight: 60,
  tabLabelFontSize: 11,
} as const;

/** Bottom tab bar — white strip, top border (same feel as before) */
export function tabBarOptions(theme: {
  colors: {primary: string; background?: string};
}): {
  headerShown: false;
  tabBarActiveTintColor: string;
  tabBarInactiveTintColor: string;
  tabBarStyle: ViewStyle;
  tabBarLabelStyle: TextStyle;
} {
  return {
    headerShown: false,
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: '#9E9E9E',
    tabBarStyle: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      height: foodReceiptLayout.tabBarHeight,
      paddingBottom: 8,
      paddingTop: 4,
    },
    tabBarLabelStyle: {
      fontSize: foodReceiptLayout.tabLabelFontSize,
      fontWeight: '600',
    },
  };
}

/** Card wrapper for list rows (Surface elevation) */
export const listCardSurface: ViewStyle = {
  marginHorizontal: foodReceiptLayout.cardMarginH,
  marginVertical: foodReceiptLayout.cardMarginV,
  borderRadius: foodReceiptLayout.cardRadius,
};
