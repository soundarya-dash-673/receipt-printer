import React, {useState, useCallback} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Text, List, FAB, Portal, Dialog, TextInput, Button, useTheme} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import * as toppingRepo from '../data/repositories/toppingCatalogRepository';
import type {ToppingCatalogItem} from '../domain/models';

export default function ToppingsSetupScreen() {
  const theme = useTheme();
  const [rows, setRows] = useState<ToppingCatalogItem[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const load = useCallback(async () => {
    setRows(await toppingRepo.getAllToppings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openNew = () => {
    setEditId(null);
    setName('');
    setPrice('0');
    setDialog(true);
  };

  const openEdit = (t: ToppingCatalogItem) => {
    setEditId(t.id);
    setName(t.name);
    setPrice(String(t.price));
    setDialog(true);
  };

  const save = async () => {
    const p = parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) {
      return;
    }
    if (editId) {
      await toppingRepo.updateTopping(editId, name, p);
    } else {
      await toppingRepo.createTopping(name, p);
    }
    setDialog(false);
    load();
  };

  const remove = (t: ToppingCatalogItem) => {
    toppingRepo.deleteTopping(t.id).then(load);
  };

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <Text variant="bodySmall" style={styles.hint}>
        Price 0 = free topping. These appear when staff tap “Toppings” on a line in New order.
      </Text>
      <FlatList
        data={rows}
        keyExtractor={t => t.id}
        renderItem={({item}) => (
          <List.Item
            title={item.name}
            description={item.price <= 0 ? 'Free' : `$${item.price.toFixed(2)} each`}
            onPress={() => openEdit(item)}
            right={() => (
              <Button onPress={() => remove(item)} textColor="#c62828">
                Delete
              </Button>
            )}
          />
        )}
      />
      <FAB icon="plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="#fff" onPress={openNew} />

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>{editId ? 'Edit topping' : 'Add topping'}</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label="Extra price (0 = free)"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              mode="outlined"
              style={{marginTop: 8}}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={save}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  hint: {padding: 16, opacity: 0.75},
  fab: {position: 'absolute', right: 16, bottom: 16},
});
