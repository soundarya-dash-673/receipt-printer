import React, {useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  useTheme,
  Searchbar,
  Button,
  Portal,
  Dialog,
  Chip,
  Divider,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp, Order} from '../context/AppContext';
import {HistoryStackParamList} from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'OrderHistory'>;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
}

export default function OrderHistoryScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {orders, deleteOrder, clearAllOrders} = useApp();
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.id.slice(-6).toLowerCase().includes(q) ||
      o.items.some(ci => {
        const toppingHit = (ci.selectedToppings ?? []).some(t =>
          t.name.toLowerCase().includes(q),
        );
        return ci.menuItem.name.toLowerCase().includes(q) || toppingHit;
      }) ||
      (o.note ?? '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const renderOrder = ({item: order}: {item: Order}) => {
    const itemNames = order.items
      .map(ci => {
        const n = (ci.selectedToppings ?? []).length;
        const hint = n > 0 ? ` (+${n})` : '';
        return `${ci.menuItem.name}${hint} ×${ci.quantity}`;
      })
      .join(', ');
    return (
      <TouchableOpacity
        style={[styles.card, {backgroundColor: theme.colors.surface}]}
        onPress={() => navigation.navigate('Receipt', {orderId: order.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.orderIdRow}>
            <View style={[styles.orderBadge, {backgroundColor: theme.colors.primary + '20'}]}>
              <Text variant="labelSmall" style={[styles.orderId, {color: theme.colors.primary}]}>
                #{order.id.slice(-6).toUpperCase()}
              </Text>
            </View>
            {order.note && (
              <MaterialCommunityIcons
                name="note-text-outline"
                size={14}
                color="#9E9E9E"
                style={{marginLeft: 6}}
              />
            )}
          </View>
          <Text variant="titleMedium" style={[styles.total, {color: theme.colors.primary}]}>
            ${order.total.toFixed(2)}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.itemNames} numberOfLines={1}>
          {itemNames}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons
              name="calendar"
              size={12}
              color="#9E9E9E"
              style={{marginRight: 4}}
            />
            <Text variant="bodySmall" style={styles.dateText}>
              {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
            </Text>
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, {marginRight: 4}]}
              onPress={() => navigation.navigate('Receipt', {orderId: order.id})}>
              <MaterialCommunityIcons name="receipt" size={18} color={theme.colors.tertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setDeleteTarget(order)}>
              <MaterialCommunityIcons name="delete-outline" size={18} color="#EF5350" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Stats Bar */}
      <View style={[styles.statsBar, {backgroundColor: theme.colors.primary}]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>

      {/* Search & Clear */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search orders..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          iconColor={theme.colors.primary}
        />
        {orders.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllBtn}
            onPress={() => setShowClearAllDialog(true)}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#EF5350" />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="history" size={72} color="#BDBDBD" />
          <Text variant="titleMedium" style={styles.emptyText}>
            {orders.length === 0 ? 'No orders yet' : 'No results found'}
          </Text>
          <Text variant="bodySmall" style={styles.emptySubText}>
            {orders.length === 0
              ? 'Place your first order from the Order tab'
              : 'Try a different search term'}
          </Text>
        </View>
      ) : (
        <View style={styles.listWrap}>
          <Text variant="bodySmall" style={[styles.count, {color: theme.colors.onSurfaceVariant}]}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          </Text>
          <FlatList
            style={styles.listScroll}
            data={filtered}
            keyExtractor={o => o.id}
            renderItem={renderOrder}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={{height: 8}} />}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Delete single order dialog */}
      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Order</Dialog.Title>
          <Dialog.Content>
            <Text>
              Delete order #{deleteTarget?.id.slice(-6).toUpperCase()}? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              textColor="#E53935"
              onPress={() => {
                if (deleteTarget) {deleteOrder(deleteTarget.id);}
                setDeleteTarget(null);
              }}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Clear all dialog */}
        <Dialog visible={showClearAllDialog} onDismiss={() => setShowClearAllDialog(false)}>
          <Dialog.Title>Clear All Orders?</Dialog.Title>
          <Dialog.Content>
            <Text>This will permanently delete all {orders.length} orders from history.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearAllDialog(false)}>Cancel</Button>
            <Button
              textColor="#E53935"
              onPress={() => {clearAllOrders(); setShowClearAllDialog(false);}}>
              Clear All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {alignItems: 'center', paddingHorizontal: 28},
  statValue: {color: '#fff', fontSize: 20, fontWeight: '700'},
  statLabel: {color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2},
  statDivider: {width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)'},
  searchRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10},
  searchBar: {flex: 1, borderRadius: 10},
  clearAllBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  count: {paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2},
  listWrap: {flex: 1},
  listScroll: {flex: 1},
  list: {padding: 12, paddingBottom: 24},
  card: {
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  orderIdRow: {flexDirection: 'row', alignItems: 'center'},
  orderBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6},
  orderId: {fontWeight: '700'},
  total: {fontWeight: '700', fontSize: 16},
  itemNames: {color: '#757575', marginTop: 6, marginBottom: 8},
  cardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  dateRow: {flexDirection: 'row', alignItems: 'center'},
  dateText: {color: '#9E9E9E'},
  footerActions: {flexDirection: 'row', alignItems: 'center'},
  iconBtn: {padding: 4},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80},
  emptyText: {color: '#757575', marginTop: 12},
  emptySubText: {color: '#BDBDBD', textAlign: 'center'},
});
