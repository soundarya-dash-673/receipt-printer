import React, {useState, useCallback} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, List, Button, Divider, useTheme} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '../stores/authStore';
import * as settingsRepo from '../data/repositories/settingsRepository';
import type {SettingsStackParamList} from '../navigation/types';
import {navigationRef} from '../navigation/navigationRef';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

export default function SettingsHomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.currentUser);
  const clearSession = useAuthStore(s => s.clearSession);
  const [shop, setShop] = useState('');

  const load = useCallback(async () => {
    const s = await settingsRepo.getSettings();
    setShop(s.shopName);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScrollView style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <Text variant="titleMedium" style={styles.pad}>
        Signed in as {user?.name ?? '—'} ({user?.role ?? '—'})
      </Text>
      <Text variant="bodySmall" style={styles.pad}>
        Shop: {shop}
      </Text>
      <Divider />
      <List.Item
        title="Branding & receipt"
        description="Shop name, tax, logo, footer"
        left={p => <List.Icon {...p} icon="palette" />}
        onPress={() => navigation.navigate('BrandingSetup')}
      />
      <List.Item
        title="Printers"
        description="Saved Bluetooth printers"
        left={p => <List.Icon {...p} icon="printer" />}
        onPress={() => navigation.navigate('PrinterSetup')}
      />
      <List.Item
        title="Toppings"
        description="Extra & free toppings for new orders"
        left={p => <List.Icon {...p} icon="food-variant" />}
        onPress={() => navigation.navigate('ToppingsSetup')}
      />
      {user?.role === 'owner' ? (
        <List.Item
          title="Staff"
          description="Manage PIN users"
          left={p => <List.Icon {...p} icon="account-group" />}
          onPress={() => navigation.navigate('StaffManagement')}
        />
      ) : null}
      <Button
        mode="outlined"
        onPress={() => {
          clearSession();
          if (navigationRef.isReady()) {
            navigationRef.reset({index: 0, routes: [{name: 'Login'}]});
          }
        }}
        style={styles.logout}>
        Sign out
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  pad: {paddingHorizontal: 16, paddingTop: 16},
  logout: {margin: 24, borderRadius: 12},
});
