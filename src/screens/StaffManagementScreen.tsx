import React, {useState, useCallback} from 'react';
import {View, FlatList, StyleSheet, Alert} from 'react-native';
import {Text, List, FAB, Portal, Dialog, TextInput, Button, useTheme} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import * as userRepo from '../data/repositories/userRepository';
import {useAuthStore} from '../stores/authStore';
import type {User, UserRole} from '../domain/models';

export default function StaffManagementScreen() {
  const theme = useTheme();
  const selfId = useAuthStore(s => s.userId);
  const [users, setUsers] = useState<User[]>([]);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const load = useCallback(async () => {
    setUsers(await userRepo.getAllUsers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const add = async () => {
    if (!name.trim() || pin.length < 4) {
      Alert.alert('Need name and PIN (4+ digits)');
      return;
    }
    await userRepo.createUser(name.trim(), role, pin);
    setDialog(false);
    setName('');
    setPin('');
    setRole('staff');
    load();
  };

  const remove = (u: User) => {
    if (u.id === selfId) {
      Alert.alert("You can't delete yourself");
      return;
    }
    if (u.role === 'owner') {
      const owners = users.filter(x => x.role === 'owner');
      if (owners.length <= 1) {
        Alert.alert('Keep at least one owner');
        return;
      }
    }
    Alert.alert('Delete user?', u.name, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => userRepo.deleteUser(u.id).then(load)},
    ]);
  };

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={users}
        keyExtractor={u => u.id}
        renderItem={({item}) => (
          <List.Item
            title={item.name}
            description={item.role}
            right={() => (
              <Button onPress={() => remove(item)} textColor="#c62828">
                Delete
              </Button>
            )}
          />
        )}
      />
      <FAB icon="account-plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="#fff" onPress={() => setDialog(true)} />

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Add staff</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label="PIN"
              value={pin}
              onChangeText={t => setPin(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              secureTextEntry
              mode="outlined"
              style={{marginTop: 8}}
            />
            <Text variant="labelLarge" style={{marginTop: 12}}>
              Role
            </Text>
            <Button mode={role === 'staff' ? 'contained' : 'outlined'} onPress={() => setRole('staff')}>
              Staff
            </Button>
            <Button mode={role === 'owner' ? 'contained' : 'outlined'} onPress={() => setRole('owner')} style={{marginTop: 8}}>
              Owner
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={add}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  fab: {position: 'absolute', right: 16, bottom: 16},
});
