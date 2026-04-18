import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text, Button, RadioButton, useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useDraftOrderStore} from '../stores/draftOrderStore';
import {useAuthStore} from '../stores/authStore';
import * as settingsRepo from '../data/repositories/settingsRepository';
import * as orderRepo from '../data/repositories/orderRepository';
import {calcTotals, lineSubtotal, effectiveUnitPrice} from '../utils/orderCalculations';
import type {PaymentMethod} from '../domain/models';
import {PAYMENT_LABELS} from '../domain/models';
import type {OrderStackParamList} from '../navigation/types';

type Nav = NativeStackNavigationProp<OrderStackParamList, 'OrderSummary'>;

export default function OrderSummaryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const lines = useDraftOrderStore(s => s.lines);
  const note = useDraftOrderStore(s => s.note);
  const clear = useDraftOrderStore(s => s.clear);
  const userId = useAuthStore(s => s.userId);

  const [taxPct, setTaxPct] = useState(8.5);
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsRepo.getSettings().then(s => setTaxPct(s.taxPercentage));
  }, []);

  const totals = calcTotals(lines, taxPct);

  const place = async () => {
    setBusy(true);
    try {
      const payload = lines.map(l => ({
        itemName: l.itemName,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        toppings: l.toppings.map(t => ({name: t.name, price: t.price})),
      }));
      const created = await orderRepo.createOrder(
        payload,
        PAYMENT_LABELS[payment],
        userId,
        totals.subtotal,
        totals.taxAmount,
        totals.total,
        note.trim() || null,
      );
      clear();
      navigation.replace('ReceiptDetail', {orderId: created.order.id});
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={[styles.root, {backgroundColor: theme.colors.background}]} contentContainerStyle={styles.content}>
      <Text variant="titleLarge" style={{color: '#0A1A2F'}}>
        Checkout
      </Text>
      {lines.map(l => (
        <View key={l.tempId} style={styles.lineBlock}>
          <Text variant="bodyMedium">
            {l.quantity}× {l.itemName} — ${lineSubtotal(l).toFixed(2)}
          </Text>
          <Text variant="bodySmall" style={{opacity: 0.75}}>
            Base ${l.unitPrice.toFixed(2)} · with toppings ${effectiveUnitPrice(l).toFixed(2)} each
          </Text>
          {l.toppings.length > 0 ? (
            <Text variant="bodySmall" style={{opacity: 0.85}}>
              {l.toppings.map(t => (t.price > 0 ? `${t.name} (+$${t.price.toFixed(2)})` : `${t.name} (free)`)).join(' · ')}
            </Text>
          ) : null}
        </View>
      ))}
      <Text style={styles.mt}>Subtotal ${totals.subtotal.toFixed(2)}</Text>
      <Text>
        Tax ({taxPct}%) ${totals.taxAmount.toFixed(2)}
      </Text>
      <Text variant="titleMedium" style={{color: theme.colors.primary, marginTop: 8}}>
        Total ${totals.total.toFixed(2)}
      </Text>

      <Text variant="titleSmall" style={styles.mt}>
        Payment
      </Text>
      <RadioButton.Group value={payment} onValueChange={v => setPayment(v as PaymentMethod)}>
        {(['cash', 'card', 'other'] as PaymentMethod[]).map(m => (
          <RadioButton.Item key={m} label={PAYMENT_LABELS[m]} value={m} />
        ))}
      </RadioButton.Group>

      <Button mode="contained" loading={busy} onPress={place} style={styles.btn}>
        Place order
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {padding: 20, paddingBottom: 40},
  lineBlock: {marginBottom: 12},
  mt: {marginTop: 16},
  btn: {marginTop: 24, borderRadius: 12},
});
