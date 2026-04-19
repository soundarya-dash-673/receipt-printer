import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
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
import {sortMenuCategories} from '../utils/menuCategories';

type NavigationProp = NativeStackNavigationProp<MenuStackParamList, 'MenuList'>;

export default function MenuScreen() {
  const theme = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const {menuItems, addToCart, deleteMenuItem} = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map(m => m.category));
    return ['All', ...sortMenuCategories(cats)];
  }, [menuItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return menuItems.filter(item => {
      const toppingMatch = (item.toppings ?? []).some(top =>
        top.name.toLowerCase().includes(q),
      );
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        toppingMatch;
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

  const renderItem = useCallback(
    ({item}: {item: MenuItem}) => (
      <View style={[styles.card, {backgroundColor: theme.colors.surface}]}>
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor:
                  item.category === 'Toppings'
                    ? theme.colors.tertiary
                    : theme.colors.primary,
              },
            ]}
          />
          <View style={styles.cardInfo}>
            <Text variant="titleMedium" style={styles.itemName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={[styles.categoryText, {color: theme.colors.secondary}]}>
              {item.category}
            </Text>
            {item.description ? (
              <Text variant="bodySmall" style={styles.description} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            {item.toppings?.some(t => t.required || t.includedByDefault) ? (
              <Text variant="labelSmall" style={styles.includesLine} numberOfLines={2}>
                Includes:{' '}
                {item.toppings
                  .filter(t => t.required || t.includedByDefault)
                  .map(t => t.name)
                  .join(', ')}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text variant="titleMedium" style={[styles.price, {color: theme.colors.primary}]}>
            ${item.price.toFixed(2)}
          </Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: '#E8F5E9'}]}
              onPress={() => {
                if (item.toppings && item.toppings.length > 0) {
                  navigation.navigate('MenuItemCustomize', {itemId: item.id});
                } else {
                  addToCart(item, []);
                }
              }}>
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
    ),
    [theme.colors, navigation, addToCart],
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.headerBlock}>
        <Searchbar
          placeholder="Search menu items..."
          value={search}
          onChangeText={setSearch}
          style={[styles.searchBar, {backgroundColor: theme.colors.surface}]}
          inputStyle={styles.searchInput}
          elevation={Platform.OS === 'ios' ? 0 : 1}
          iconColor={theme.colors.primary}
          placeholderTextColor={theme.colors.onSurfaceVariant}
        />

        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}>
          {categories.map(cat => (
            <Chip
              key={cat}
              mode="flat"
              compact
              selected={selectedCategory === cat}
              showSelectedOverlay
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.chip,
                {
                  borderWidth: selectedCategory === cat ? 0 : 1,
                  borderColor: theme.colors.outline ?? '#E8DDD4',
                  backgroundColor:
                    selectedCategory === cat ? theme.colors.primary : theme.colors.surface,
                },
              ]}
              textStyle={{
                fontWeight: selectedCategory === cat ? '600' : '500',
                color: selectedCategory === cat ? '#fff' : theme.colors.onSurface,
              }}>
              {cat}
            </Chip>
          ))}
        </ScrollView>

        <Divider />

        <Text variant="bodySmall" style={[styles.countText, {color: theme.colors.onSurfaceVariant}]}>
          {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        </Text>
      </View>
    ),
    [search, theme.colors, categories, selectedCategory, filtered.length],
  );

  const ListEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconWrap, {backgroundColor: theme.colors.surfaceVariant}]}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={40} color={theme.colors.primary} />
        </View>
        <Text variant="titleLarge" style={[styles.emptyTitle, {color: theme.colors.onSurface}]}>
          {menuItems.length === 0 ? 'Your menu is empty' : 'No matches'}
        </Text>
        <Text variant="bodyMedium" style={[styles.emptySubText, {color: theme.colors.onSurfaceVariant}]}>
          {menuItems.length === 0
            ? 'Add dishes and drinks so you can take orders faster.'
            : 'Try another search or category.'}
        </Text>
      </View>
    ),
    [menuItems.length, theme.colors],
  );

  const keyExtractor = useCallback((item: MenuItem) => item.id, []);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        mode="elevated"
        style={[
          styles.fab,
          {backgroundColor: theme.colors.primary, bottom: tabBarHeight + 16},
        ]}
        onPress={() => navigation.navigate('MenuItemForm', {})}
        color="#fff"
        customSize={56}
      />

      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete Item</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{deleteTarget?.name}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button textColor="#C62828" onPress={confirmDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  headerBlock: {
    paddingBottom: 4,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 12,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
  searchInput: {fontSize: 15, minHeight: 0},
  /** Prevents horizontal ScrollView from stretching vertically in a column */
  chipScroll: {flexGrow: 0},
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {marginRight: 8, height: 34},
  countText: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    letterSpacing: 0.2,
  },
  list: {flex: 1},
  listContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  separator: {height: 8},
  card: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cardLeft: {flexDirection: 'row', flex: 1, alignItems: 'center'},
  categoryDot: {width: 5, height: 36, borderRadius: 3, marginRight: 10},
  cardInfo: {flex: 1},
  itemName: {fontWeight: '600'},
  categoryText: {marginTop: 2},
  description: {marginTop: 2, color: '#757575'},
  includesLine: {marginTop: 4, color: '#616161', lineHeight: 16},
  cardRight: {alignItems: 'flex-end', justifyContent: 'center'},
  price: {fontWeight: '700', fontSize: 16, marginBottom: 6},
  actionsRow: {flexDirection: 'row', alignItems: 'center'},
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    minHeight: 220,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {textAlign: 'center', fontWeight: '700', marginBottom: 8},
  emptySubText: {textAlign: 'center', lineHeight: 22},
  fab: {
    position: 'absolute',
    right: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#E86A2B',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      default: {},
    }),
  },
});
