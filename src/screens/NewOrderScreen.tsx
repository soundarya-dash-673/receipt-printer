import React, {useState} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {Text, Button, IconButton, TextInput, FAB, Portal, Dialog, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDraftOrderStore} from '../stores/draftOrderStore';
import * as settingsRepo from '../data/repositories/settingsRepository';
import {calcTotals} from '../utils/orderCalculations';
import type {OrderStackParamList} from '../navigation/types';

type Nav = NativeStackNavigationProp<OrderStackParamList, 'NewOrder'>;

export default function NewOrderScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const lines = useDraftOrderStore(s => s.lines);
  const addLine = useDraftOrderStore(s => s.addLine);
  const updateLine = useDraftOrderStore(s => s.updateLine);
  const removeLine = useDraftOrderStore(s => s.removeLine);
  const note = useDraftOrderStore(s => s.note);
  const setNote = useDraftOrderStore(s => s.setNote);

  const [taxPct, setTaxPct] = useState(8.5);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');

  React.useEffect(() => {
    settingsRepo.getSettings().then(s => setTaxPct(s.taxPercentage));
  }, []);

  const totals = calcTotals(lines, taxPct);

  const submitLine = () => {
    const p = parseFloat(price);
    const q = parseInt(qty, 10) || 1;
    if (!name.trim() || Number.isNaN(p)) {
      return;
    }
    addLine(name.trim(), p, q);
    setName('');
    setPrice('');
    setQty('1');
    setDialog(false);
  };

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <Text variant="titleMedium" style={styles.pad}>
        Line items
      </Text>
      <FlatList
        data={lines}
        keyExtractor={l => l.tempId}
        ListEmptyComponent={
          <Text style={styles.empty}>Tap + to add items (name & price).</Text>
        }
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text variant="titleSmall">{item.itemName}</Text>
              <Text variant="bodySmall" style={{opacity: 0.7}}>
                ${item.unitPrice.toFixed(2)} × {item.quantity}
              </Text>
            </View>
            <IconButton
              icon="minus"
              onPress={() =>
                updateLine(item.tempId, {quantity: Math.max(1, item.quantity - 1)})
              }
            />
            <IconButton
              icon="plus"
              onPress={() => updateLine(item.tempId, {quantity: item.quantity + 1})}
            />
            <IconButton icon="delete" iconColor="#c62828" onPress={() => removeLine(item.tempId)} />
          </View>
        )}
      />

      <TextInput
        label="Order note (optional)"
        value={note}
        onChangeText={setNote}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.totals}>
        <Text>Subtotal: ${totals.subtotal.toFixed(2)}</Text>
        <Text>
          Tax ({taxPct}%): ${totals.taxAmount.toFixed(2)}
        </Text>
        <Text variant="titleMedium" style={{color: theme.colors.primary}}>
          Total: ${totals.total.toFixed(2)}
        </Text>
      </View>

      <Button
        mode="contained"
        disabled={lines.length === 0}
        onPress={() => navigation.navigate('OrderSummary')}
        style={styles.next}>
        Review & checkout
      </Button>

      <FAB icon="plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="#fff" onPress={() => setDialog(true)} />

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Add item</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label="Unit price"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              mode="outlined"
              style={{marginTop: 8}}
            />
            <TextInput
              label="Quantity"
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              mode="outlined"
              style={{marginTop: 8}}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={submitLine}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 16},
  pad: {marginBottom: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  empty: {textAlign: 'center', opacity: 0.5, padding: 24},
  input: {marginBottom: 12, backgroundColor: '#fff'},
  totals: {gap: 4, marginBottom: 12},
  next: {borderRadius: 12, marginBottom: 80},
  fab: {position: 'absolute', right: 16, bottom: 16},
});
