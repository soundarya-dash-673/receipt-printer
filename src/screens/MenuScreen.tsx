import React, {useState, useMemo} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  FAB,
  Searchbar,
  Text,
  Chip,
  useTheme,
  Divider,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp, MenuItem} from '../context/AppContext';
import {MenuStackParamList} from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<MenuStackParamList, 'MenuList'>;

export default function MenuScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {menuItems, addToCart, deleteMenuItem} = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map(m => m.category)));
    return ['All', ...cats.sort()];
  }, [menuItems]);

  const filtered = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, search, selectedCategory]);

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteMenuItem(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const renderItem = ({item}: {item: MenuItem}) => (
    <View style={[styles.card, {backgroundColor: theme.colors.surface}]}>
      <View style={styles.cardLeft}>
        <View style={[styles.categoryDot, {backgroundColor: theme.colors.primary}]} />
        <View style={styles.cardInfo}>
          <Text variant="titleMedium" style={styles.itemName}>{item.name}</Text>
          <Text variant="bodySmall" style={[styles.categoryText, {color: theme.colors.secondary}]}>
            {item.category}
          </Text>
          {item.description ? (
            <Text variant="bodySmall" style={styles.description} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text variant="titleMedium" style={[styles.price, {color: theme.colors.primary}]}>
          ${item.price.toFixed(2)}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#E8F5E9'}]}
            onPress={() => addToCart(item)}>
            <MaterialCommunityIcons name="cart-plus" size={18} color="#2E7D32" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#E3F2FD'}]}
            onPress={() => navigation.navigate('MenuItemForm', {itemId: item.id})}>
            <MaterialCommunityIcons name="pencil" size={18} color="#1565C0" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, {backgroundColor: '#FFEBEE'}]}
            onPress={() => setDeleteTarget(item)}>
            <MaterialCommunityIcons name="delete" size={18} color="#C62828" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Search */}
      <Searchbar
        placeholder="Search menu items..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {/* Category Chips */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({item: cat}) => (
          <Chip
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.chip,
              selectedCategory === cat && {backgroundColor: theme.colors.primary},
            ]}
            textStyle={{
              color: selectedCategory === cat ? '#fff' : theme.colors.onSurface,
            }}>
            {cat}
          </Chip>
        )}
      />

      <Divider />

      {/* Item count */}
      <Text variant="bodySmall" style={[styles.countText, {color: theme.colors.onSurfaceVariant}]}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
      </Text>

      {/* Menu List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="food-off" size={64} color="#BDBDBD" />
          <Text variant="titleMedium" style={styles.emptyText}>No items found</Text>
          <Text variant="bodySmall" style={styles.emptySubText}>
            Tap + to add your first menu item
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{height: 8}} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        onPress={() => navigation.navigate('MenuItemForm', {})}
        color="#fff"
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Item</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{deleteTarget?.name}"?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button textColor="#C62828" onPress={confirmDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  searchBar: {margin: 12, borderRadius: 10},
  chipRow: {paddingHorizontal: 12, paddingVertical: 8, gap: 8},
  chip: {marginRight: 4},
  countText: {paddingHorizontal: 16, paddingBottom: 6, marginTop: 4},
  list: {padding: 12, paddingBottom: 90},
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardLeft: {flexDirection: 'row', flex: 1, alignItems: 'center'},
  categoryDot: {width: 6, height: 40, borderRadius: 3, marginRight: 12},
  cardInfo: {flex: 1},
  itemName: {fontWeight: '600'},
  categoryText: {marginTop: 2},
  description: {marginTop: 2, color: '#757575'},
  cardRight: {alignItems: 'flex-end', gap: 8},
  price: {fontWeight: '700', fontSize: 16},
  actions: {flexDirection: 'row', gap: 6},
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8},
  emptyText: {color: '#757575', marginTop: 12},
  emptySubText: {color: '#BDBDBD'},
  fab: {position: 'absolute', right: 16, bottom: 16},
});
