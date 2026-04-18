import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {slipgoLightTheme, slipgoDarkTheme} from './src/theme/slipgoTheme';
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
      card: isDarkMode ? '#122436' : '#FFFFFF',
      text: isDarkMode ? '#E8ECF1' : '#0A1A2F',
      border: '#B8C4D4',
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
