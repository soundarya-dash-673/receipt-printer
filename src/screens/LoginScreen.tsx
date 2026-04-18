import React, {useState, useCallback, useEffect} from 'react';
import {View, FlatList, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {Text, TextInput, Button, Surface, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/types';
import type {User} from '../domain/models';
import * as userRepo from '../data/repositories/userRepository';
import {useAuthStore} from '../stores/authStore';
import SlipGoLogo from '../components/SlipGoLogo';
import {slipgoTagline} from '../theme/slipgoTheme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const list = await userRepo.getAllUsers();
    setUsers(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onLogin = async () => {
    if (!selected) {
      setErr('Select a team member');
      return;
    }
    const ok = await userRepo.verifyPin(selected.id, pin);
    if (!ok) {
      setErr('Invalid PIN');
      return;
    }
    await useAuthStore.getState().setSession(selected.id);
    navigation.replace('Main');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <SlipGoLogo size={64} />
        <Text variant="headlineMedium" style={styles.brand}>
          SlipGo
        </Text>
        <Text variant="bodyMedium" style={styles.tag}>
          {slipgoTagline}
        </Text>
      </View>

      <Text variant="titleMedium" style={styles.section}>
        Sign in
      </Text>
      <FlatList
        data={users}
        keyExtractor={u => u.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({item}) => (
          <Surface
            style={[
              styles.userCard,
              {borderColor: selected?.id === item.id ? theme.colors.primary : '#E8ECF1'},
            ]}
            elevation={1}>
            <Button mode={selected?.id === item.id ? 'contained' : 'outlined'} onPress={() => setSelected(item)}>
              {item.name}
            </Button>
            <Text variant="labelSmall" style={styles.role}>
              {item.role}
            </Text>
          </Surface>
        )}
      />

      <TextInput
        label="PIN"
        value={pin}
        onChangeText={t => {
          setPin(t.replace(/[^0-9]/g, ''));
          setErr('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={8}
        style={styles.input}
        mode="outlined"
      />
      {err ? (
        <Text style={styles.error} variant="bodySmall">
          {err}
        </Text>
      ) : null}

      <Button mode="contained" onPress={onLogin} style={styles.btn}>
        Continue
      </Button>
      <Text variant="bodySmall" style={styles.hint}>
        Default owner PIN: 1234
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 20, paddingTop: 48},
  header: {alignItems: 'center', marginBottom: 24},
  brand: {color: '#0A1A2F', marginTop: 8, fontWeight: '700'},
  tag: {color: '#0A1A2F', opacity: 0.65, marginTop: 4},
  section: {marginBottom: 12, color: '#0A1A2F'},
  chips: {gap: 12, paddingVertical: 8},
  userCard: {
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  role: {textAlign: 'center', marginTop: 4, textTransform: 'uppercase', opacity: 0.6},
  input: {marginTop: 16, backgroundColor: '#fff'},
  error: {color: '#B00020', marginTop: 8},
  btn: {marginTop: 20, borderRadius: 12},
  hint: {textAlign: 'center', marginTop: 16, opacity: 0.5},
});
