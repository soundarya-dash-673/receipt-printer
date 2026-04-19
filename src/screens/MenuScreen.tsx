import React, {useState, useMemo} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
  Surface,
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
        style={[styles.searchBar, {backgroundColor: theme.colors.surface}]}
        inputStyle={styles.searchInput}
        elevation={Platform.OS === 'ios' ? 0 : 1}
        iconColor={theme.colors.primary}
        placeholderTextColor={theme.colors.onSurfaceVariant}
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
          <Surface style={[styles.emptyIconWrap, {backgroundColor: theme.colors.surfaceVariant}]} elevation={0}>
            <MaterialCommunityIcons
              name="silverware-fork-knife"
              size={40}
              color={theme.colors.primary}
            />
          </Surface>
          <Text variant="titleLarge" style={[styles.emptyTitle, {color: theme.colors.onSurface}]}>
            {menuItems.length === 0 ? 'Your menu is empty' : 'No matches'}
          </Text>
          <Text variant="bodyMedium" style={[styles.emptySubText, {color: theme.colors.onSurfaceVariant}]}>
            {menuItems.length === 0
              ? 'Add dishes and drinks so you can take orders faster.'
              : 'Try another search or category.'}
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
        mode="elevated"
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        onPress={() => navigation.navigate('MenuItemForm', {})}
        color="#fff"
        customSize={56}
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
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      default: {},
    }),
  },
  searchInput: {fontSize: 16},
  chipRow: {paddingHorizontal: 16, paddingVertical: 10, gap: 8},
  chip: {marginRight: 6, height: 36},
  countText: {paddingHorizontal: 20, paddingBottom: 8, marginTop: 6, letterSpacing: 0.2},
  list: {padding: 16, paddingBottom: 100},
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {textAlign: 'center', fontWeight: '700'},
  emptySubText: {textAlign: 'center', lineHeight: 22},
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
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
