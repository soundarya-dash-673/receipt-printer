import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBootstrapStore} from '../stores/appBootstrapStore';
import {useAuthStore} from '../stores/authStore';
import SlipGoLogo from '../components/SlipGoLogo';
import {slipgoTagline} from '../theme/slipgoTheme';
import type {RootStackParamList} from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const init = useBootstrapStore(s => s.init);
  const error = useBootstrapStore(s => s.error);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = useAuthStore.persist;
      if (p && typeof p.rehydrate === 'function') {
        await p.rehydrate();
      }
      await init();
      if (cancelled) {
        return;
      }
      await useAuthStore.getState().hydrateUser();
      if (cancelled) {
        return;
      }
      const uid = useAuthStore.getState().userId;
      if (uid) {
        navigation.replace('Main');
      } else {
        navigation.replace('Login');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [init, navigation]);

  if (error) {
    return (
      <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
        <Text variant="bodyLarge" style={styles.err}>
          Database error: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
      <SlipGoLogo size={72} />
      <Text variant="headlineSmall" style={[styles.title, {color: theme.colors.onSurface}]}>
        SlipGo
      </Text>
      <Text variant="bodySmall" style={[styles.tag, {color: theme.colors.onSurface}]}>
        {slipgoTagline}
      </Text>
      <ActivityIndicator color={theme.colors.primary} style={styles.spin} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {marginTop: 12, fontWeight: '700'},
  tag: {opacity: 0.7, marginTop: 4},
  spin: {marginTop: 24},
  err: {color: '#B00020', padding: 24, textAlign: 'center'},
});
