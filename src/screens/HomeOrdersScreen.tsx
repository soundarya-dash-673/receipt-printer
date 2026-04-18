import React, {useCallback, useState} from 'react';
import {View, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Text, List, useTheme} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../navigation/types';
import type {OrderEntity} from '../domain/models';
import * as orderRepo from '../data/repositories/orderRepository';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeOrders'>;

export default function HomeOrdersScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await orderRepo.listOrders(200);
    setOrders(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty} variant="bodyLarge">
            No orders yet. Open the Order tab to create one.
          </Text>
        }
        renderItem={({item}) => (
          <List.Item
            title={`Order #${item.orderNumber}`}
            description={`${new Date(item.createdAt).toLocaleString()} · ${item.paymentMethod}`}
            right={() => (
              <Text variant="titleMedium" style={{color: theme.colors.primary}}>
                ${item.totalAmount.toFixed(2)}
              </Text>
            )}
            onPress={() => navigation.navigate('ReceiptDetail', {orderId: item.id})}
            style={styles.item}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  item: {backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 12},
  empty: {textAlign: 'center', marginTop: 48, padding: 24, opacity: 0.6},
});
