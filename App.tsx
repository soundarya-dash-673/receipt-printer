import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {slipgoLightTheme, slipgoDarkTheme, appPalette} from './src/theme/slipgoTheme';
import {navigationRef} from './src/navigation/navigationRef';

export default function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const paper = isDarkMode ? slipgoDarkTheme : slipgoLightTheme;
  const navTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: paper.colors.primary,
      background: paper.colors.background,
      card: isDarkMode ? (paper.colors.surface ?? '#1E1E1E') : appPalette.surface,
      text: isDarkMode ? '#F5F5F4' : appPalette.onSurface,
      border: appPalette.borderSoft,
      notification: paper.colors.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paper}>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={paper.colors.background}
          />
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
