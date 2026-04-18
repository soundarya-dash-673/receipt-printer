import React, {useState, useCallback} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {ActivityIndicator} from 'react-native';
import {Text, Button, Chip, useTheme} from 'react-native-paper';
import * as orderRepo from '../data/repositories/orderRepository';
import {getRangeForPreset, type Preset} from '../utils/dateRange';
import {exportOrdersReportPdf} from '../utils/reportsPdf';
import type {OrderEntity} from '../domain/models';

export default function ReportsScreen() {
  const theme = useTheme();
  const [preset, setPreset] = useState<Preset>('today');
  const [agg, setAgg] = useState<{sum: number; count: number} | null>(null);
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {start, end} = getRangeForPreset(preset);
      const [a, list] = await Promise.all([
        orderRepo.aggregateRange(start, end),
        orderRepo.listOrdersInRange(start, end),
      ]);
      setAgg(a);
      setOrders(list);
    } finally {
      setLoading(false);
    }
  }, [preset]);

  React.useEffect(() => {
    load();
  }, [load]);

  const exportPdf = async () => {
    const {start, end} = getRangeForPreset(preset);
    const title = `${preset} (${start.slice(0, 10)} — ${end.slice(0, 10)})`;
    await exportOrdersReportPdf(orders, title);
  };

  return (
    <ScrollView style={[styles.root, {backgroundColor: theme.colors.background}]} contentContainerStyle={styles.pad}>
      <Text variant="titleLarge" style={{color: '#0A1A2F'}}>
        Reports
      </Text>
      <View style={styles.chips}>
        {(['today', 'week', 'month'] as Preset[]).map(p => (
          <Chip key={p} selected={preset === p} onPress={() => setPreset(p)} style={styles.chip}>
            {p}
          </Chip>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 24}} />
      ) : agg ? (
        <View style={styles.card}>
          <Text variant="headlineSmall" style={{color: theme.colors.primary}}>
            ${agg.sum.toFixed(2)}
          </Text>
          <Text variant="bodyMedium">{agg.count} orders</Text>
        </View>
      ) : null}

      <Button mode="outlined" onPress={load} style={styles.btn}>
        Refresh
      </Button>
      <Button mode="contained" onPress={exportPdf} disabled={orders.length === 0} style={styles.btn}>
        Export range as PDF
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  pad: {padding: 20, paddingBottom: 40},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16},
  chip: {marginRight: 8},
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 12,
    elevation: 2,
  },
  btn: {marginTop: 12, borderRadius: 12},
});
