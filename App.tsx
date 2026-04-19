import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider, MD3LightTheme, MD3DarkTheme} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import {AppProvider} from './src/context/AppContext';
import {AuthProvider} from './src/context/AuthContext';

const lightTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#E86A2B',
    secondary: '#F4A261',
    tertiary: '#2A9D8F',
    surface: '#FFFFFF',
    surfaceVariant: '#F3EDE7',
    background: '#F8F4F0',
    onPrimary: '#FFFFFF',
    outline: '#E8DDD4',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F4A261',
    secondary: '#E86A2B',
    tertiary: '#2A9D8F',
    outline: '#4A4540',
  },
};

export default function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppProvider>
            <NavigationContainer>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
              />
              <AppNavigator />
            </NavigationContainer>
          </AppProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
