import React, {useState, useCallback} from 'react';
import {View, FlatList, StyleSheet, ScrollView} from 'react-native';
import {
  Text,
  Button,
  IconButton,
  TextInput,
  FAB,
  Portal,
  Dialog,
  useTheme,
  Chip,
  Checkbox,
  Surface,
} from 'react-native-paper';
import {foodReceiptLayout, listCardSurface} from '../theme/foodReceiptLayout';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDraftOrderStore} from '../stores/draftOrderStore';
import * as settingsRepo from '../data/repositories/settingsRepository';
import * as toppingRepo from '../data/repositories/toppingCatalogRepository';
import {calcTotals, effectiveUnitPrice, lineSubtotal} from '../utils/orderCalculations';
import type {OrderStackParamList} from '../navigation/types';
import type {DraftLineItem, ToppingCatalogItem} from '../domain/models';

type Nav = NativeStackNavigationProp<OrderStackParamList, 'NewOrder'>;

export default function NewOrderScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const lines = useDraftOrderStore(s => s.lines);
  const addLine = useDraftOrderStore(s => s.addLine);
  const updateLine = useDraftOrderStore(s => s.updateLine);
  const setLineToppings = useDraftOrderStore(s => s.setLineToppings);
  const removeLine = useDraftOrderStore(s => s.removeLine);
  const note = useDraftOrderStore(s => s.note);
  const setNote = useDraftOrderStore(s => s.setNote);

  const [taxPct, setTaxPct] = useState(8.5);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');

  const [catalog, setCatalog] = useState<ToppingCatalogItem[]>([]);
  /** Which line’s topping picker is open (live data from `lines`) */
  const [toppingsLineId, setToppingsLineId] = useState<string | null>(null);
  const topDialogLine = toppingsLineId ? lines.find(l => l.tempId === toppingsLineId) ?? null : null;

  React.useEffect(() => {
    settingsRepo.getSettings().then(s => setTaxPct(s.taxPercentage));
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalog(await toppingRepo.getAllToppings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog]),
  );

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

  const toggleTopping = (line: DraftLineItem, cat: ToppingCatalogItem) => {
    const sel = new Set(line.toppings.map(t => t.catalogId));
    let next = [...line.toppings];
    if (sel.has(cat.id)) {
      next = next.filter(t => t.catalogId !== cat.id);
    } else {
      next = [...next, {catalogId: cat.id, name: cat.name, price: cat.price}];
    }
    setLineToppings(line.tempId, next);
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
          <Text style={styles.empty}>Tap + to add items (name & base price), then add toppings per line.</Text>
        }
        renderItem={({item}) => (
          <Surface style={[listCardSurface, styles.cardElev]} elevation={2}>
            <View style={styles.row}>
            <View style={{flex: 1}}>
              <Text variant="titleSmall">{item.itemName}</Text>
              <Text variant="bodySmall" style={{opacity: 0.7}}>
                Base ${item.unitPrice.toFixed(2)} × {item.quantity} · Line ${lineSubtotal(item).toFixed(2)}
              </Text>
              {item.toppings.length > 0 ? (
                <View style={styles.chips}>
                  {item.toppings.map(t => (
                    <Chip key={t.catalogId} compact style={styles.chip} textStyle={{fontSize: 11}}>
                      {t.name}
                      {t.price > 0 ? ` +$${t.price.toFixed(2)}` : ' (free)'}
                    </Chip>
                  ))}
                </View>
              ) : null}
            </View>
            <IconButton
              icon="food-variant"
              accessibilityLabel="Toppings"
              onPress={() => setToppingsLineId(item.tempId)}
            />
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
          </Surface>
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

      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: theme.colors.primary, bottom: foodReceiptLayout.fabOffsetBottom}]}
        color="#fff"
        onPress={() => setDialog(true)}
      />

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Add item</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label="Base unit price"
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

      <Portal>
        <Dialog visible={!!toppingsLineId} onDismiss={() => setToppingsLineId(null)}>
          <Dialog.Title>Toppings</Dialog.Title>
          <Dialog.Content style={{maxHeight: 400}}>
            <ScrollView>
              {topDialogLine ? (
                <>
                  <Text variant="bodySmall" style={{marginBottom: 8, opacity: 0.8}}>
                    {topDialogLine.itemName} — eff. ${effectiveUnitPrice(topDialogLine).toFixed(2)} each with selected
                    toppings
                  </Text>
                  {catalog.map(cat => {
                    const checked = topDialogLine.toppings.some(t => t.catalogId === cat.id);
                    return (
                      <Checkbox.Item
                        key={cat.id}
                        label={`${cat.name}${cat.price > 0 ? ` (+$${cat.price.toFixed(2)})` : ' (free)'}`}
                        status={checked ? 'checked' : 'unchecked'}
                        onPress={() => toggleTopping(topDialogLine, cat)}
                      />
                    );
                  })}
                </>
              ) : null}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setToppingsLineId(null)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 16},
  pad: {marginBottom: 8},
  cardElev: {backgroundColor: '#FFFFFF'},
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
  },
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6},
  chip: {height: 28},
  empty: {textAlign: 'center', opacity: 0.5, padding: 24},
  input: {marginBottom: 12, backgroundColor: '#fff'},
  totals: {gap: 4, marginBottom: 12},
  next: {borderRadius: 12, marginBottom: 80},
  fab: {position: 'absolute', right: 16},
});
