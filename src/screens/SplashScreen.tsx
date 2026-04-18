import React, {useEffect} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useBootstrapStore} from '../stores/appBootstrapStore';
import {useAuthStore} from '../stores/authStore';
import SlipGoLogo from '../components/SlipGoLogo';
import {slipgoTagline} from '../theme/slipgoTheme';
import type {RootStackParamList} from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
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
      <View style={styles.center}>
        <Text variant="bodyLarge" style={styles.err}>
          Database error: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <SlipGoLogo size={72} />
      <Text variant="headlineSmall" style={styles.title}>
        SlipGo
      </Text>
      <Text variant="bodySmall" style={styles.tag}>
        {slipgoTagline}
      </Text>
      <ActivityIndicator style={styles.spin} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8ECF1'},
  title: {marginTop: 12, color: '#0A1A2F', fontWeight: '700'},
  tag: {color: '#0A1A2F', opacity: 0.7, marginTop: 4},
  spin: {marginTop: 24},
  err: {color: '#B00020', padding: 24, textAlign: 'center'},
});
