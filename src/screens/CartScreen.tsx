import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  Divider,
  useTheme,
  TextInput,
  Banner,
  Portal,
  Dialog,
  Chip,
} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useApp, CartItem, MenuItem, unitPriceForLine} from '../context/AppContext';
import {formatToppingPriceLabel} from '../utils/toppingPrice';
import {sortMenuCategories} from '../utils/menuCategories';
import {CartStackParamList} from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<CartStackParamList, 'Cart'>;

export default function CartScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const {
    cartItems,
    cartSubtotal,
    cartTaxAmount,
    cartTotal,
    menuItems,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    settings,
  } = useApp();

  const [note, setNote] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const [quickCategory, setQuickCategory] = useState<string>('All');

  const quickCategories = useMemo(() => {
    const cats = new Set(menuItems.map(m => m.category));
    return ['All', ...sortMenuCategories(cats)];
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase();
    return menuItems.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);
      const matchesCat =
        quickCategory === 'All' || m.category === quickCategory;
      return matchesSearch && matchesCat;
    });
  }, [menuItems, menuSearch, quickCategory]);

  useEffect(() => {
    if (showMenu) {
      setQuickCategory('All');
      setMenuSearch('');
    }
  }, [showMenu]);

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {return;}
    const order = placeOrder(note.trim() || undefined);
    setNote('');
    navigation.navigate('Receipt', {orderId: order.id});
  };

  const renderCartItem = ({item}: {item: CartItem}) => {
    const unit = unitPriceForLine(item.menuItem, item.selectedToppings ?? []);
    const toppings = item.selectedToppings ?? [];
    const hasToppingOptions =
      !!item.menuItem.toppings && item.menuItem.toppings.length > 0;
    return (
      <View style={[styles.cartRow, {backgroundColor: theme.colors.surface}]}>
        <View style={styles.cartRowLeft}>
          <Text variant="bodyLarge" style={styles.cartItemName}>{item.menuItem.name}</Text>
          <Text variant="bodySmall" style={{color: theme.colors.secondary}}>
            ${unit.toFixed(2)} each
          </Text>
          {hasToppingOptions ? (
            <TouchableOpacity
              style={styles.toppingsLink}
              onPress={() =>
                navigation.navigate('MenuItemCustomize', {
                  itemId: item.menuItem.id,
                  replaceCartLineId: item.cartLineId,
                  initialSelectedIds: toppings.map(t => t.id),
                })
              }
              hitSlop={{top: 6, bottom: 6, left: 4, right: 4}}>
              <MaterialCommunityIcons
                name="tune-variant"
                size={16}
                color={theme.colors.primary}
                style={styles.toppingsLinkIcon}
              />
              <Text variant="labelMedium" style={{color: theme.colors.primary}}>
                Ingredients
              </Text>
            </TouchableOpacity>
          ) : null}
          {toppings.length > 0 ? (
            <View style={styles.toppingList}>
              {toppings.map(t => (
                <Text key={t.id} variant="bodySmall" style={styles.toppingLine}>
                  + {t.name} ({formatToppingPriceLabel(t.price)})
                </Text>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.qtyControls}>
          <TouchableOpacity
            style={[styles.qtyBtn, {borderColor: theme.colors.primary}]}
            onPress={() => updateCartQuantity(item.cartLineId, item.quantity - 1)}>
            <MaterialCommunityIcons
              name={item.quantity === 1 ? 'delete-outline' : 'minus'}
              size={16}
              color={item.quantity === 1 ? '#E53935' : theme.colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.qtyText, {color: theme.colors.onSurface}]}>
            {item.quantity}
          </Text>
          <TouchableOpacity
            style={[styles.qtyBtn, {borderColor: theme.colors.primary}]}
            onPress={() => updateCartQuantity(item.cartLineId, item.quantity + 1)}>
            <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <Text variant="titleSmall" style={[styles.lineTotal, {color: theme.colors.primary}]}>
          ${(unit * item.quantity).toFixed(2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Quick Add Banner */}
      <Banner
        visible={showMenu}
        icon={({size}) => (
          <MaterialCommunityIcons name="food" size={size} color={theme.colors.primary} />
        )}
        actions={[{label: 'Close', onPress: () => setShowMenu(false)}]}>
        Pick a category (e.g. Toppings), then tap an item — customizable dishes open the topping picker.
      </Banner>

      {/* Quick Add Menu Panel */}
      {showMenu && (
        <View style={[styles.quickAdd, {backgroundColor: theme.colors.surface}]}>
          <Text variant="labelMedium" style={[styles.quickFilterLabel, {color: theme.colors.secondary}]}>
            Category
          </Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.quickCategoryScroll}
            contentContainerStyle={styles.quickCategoryRow}>
            {quickCategories.map(cat => (
              <Chip
                key={cat}
                mode="flat"
                compact
                selected={quickCategory === cat}
                showSelectedOverlay
                onPress={() => setQuickCategory(cat)}
                style={[
                  styles.quickCatChip,
                  {
                    borderWidth: quickCategory === cat ? 0 : 1,
                    borderColor: theme.colors.outline ?? '#E8DDD4',
                    backgroundColor:
                      quickCategory === cat ? theme.colors.primary : theme.colors.surface,
                  },
                ]}
                textStyle={{
                  fontWeight: quickCategory === cat ? '600' : '500',
                  color: quickCategory === cat ? '#fff' : theme.colors.onSurface,
                }}>
                {cat}
              </Chip>
            ))}
          </ScrollView>
          <TextInput
            placeholder="Search menu..."
            value={menuSearch}
            onChangeText={setMenuSearch}
            dense
            mode="outlined"
            style={styles.quickSearch}
          />
          <FlatList
            style={styles.quickChipList}
            data={filteredMenu}
            keyExtractor={m => m.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChips}
            renderItem={({item}: {item: MenuItem}) => {
              const customizable = !!(item.toppings && item.toppings.length > 0);
              const isToppingsCategory = item.category === 'Toppings';
              return (
                <TouchableOpacity
                  style={[styles.quickChip, {borderColor: theme.colors.primary}]}
                  onPress={() => {
                    if (customizable) {
                      navigation.navigate('MenuItemCustomize', {itemId: item.id});
                      setShowMenu(false);
                    } else {
                      addToCart(item, []);
                    }
                  }}>
                  <Text variant="labelSmall" numberOfLines={1} style={styles.quickChipName}>
                    {item.name}
                  </Text>
                  <Text variant="labelSmall" style={{color: theme.colors.primary}}>
                    ${item.price.toFixed(2)}
                  </Text>
                  {customizable ? (
                    <Text variant="labelSmall" style={styles.quickChipHint}>
                      + toppings
                    </Text>
                  ) : isToppingsCategory ? (
                    <Text variant="labelSmall" style={styles.quickChipHint}>
                      add-on
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled>
        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="cart-outline" size={80} color="#BDBDBD" />
            <Text variant="titleMedium" style={styles.emptyText}>Your order is empty</Text>
            <Text variant="bodySmall" style={styles.emptySubText}>
              Use Quick Add below — items with toppings open a picker before they&apos;re added.
            </Text>
            <Button
              mode="contained"
              icon="food"
              onPress={() => setShowMenu(true)}
              style={{marginTop: 16, backgroundColor: theme.colors.primary}}>
              Quick Add Items
            </Button>
          </View>
        ) : (
          <>
            {/* Items Header */}
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={{fontWeight: '700'}}>
                Order Items ({cartItems.reduce((s, c) => s + c.quantity, 0)})
              </Text>
              <TouchableOpacity onPress={() => setShowClearDialog(true)}>
                <Text style={{color: '#E53935', fontSize: 13}}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {cartItems.map(item => (
              <View key={item.cartLineId}>
                {renderCartItem({item})}
                <View style={{height: 6}} />
              </View>
            ))}

            <Button
              icon="plus-circle-outline"
              mode="text"
              onPress={() => setShowMenu(!showMenu)}
              style={styles.addMoreBtn}>
              Add More Items
            </Button>

            <Divider style={styles.divider} />

            {/* Totals */}
            <View style={[styles.totalsCard, {backgroundColor: theme.colors.surface}]}>
              <Text variant="titleSmall" style={styles.totalsTitle}>Order Summary</Text>
              <Divider style={{marginVertical: 8}} />
              <TotalRow label="Subtotal" value={cartSubtotal} />
              <TotalRow
                label={`Tax (${settings.taxRate}%)`}
                value={cartTaxAmount}
                secondary
              />
              <Divider style={{marginVertical: 8}} />
              <TotalRow label="Total" value={cartTotal} bold />
            </View>

            {/* Order Note */}
            <TextInput
              label="Order Note (optional)"
              value={note}
              onChangeText={setNote}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.noteInput}
              left={<TextInput.Icon icon="note-text-outline" />}
            />

            {/* Place Order Button */}
            <Button
              mode="contained"
              icon="receipt"
              onPress={handlePlaceOrder}
              style={[styles.placeOrderBtn, {backgroundColor: theme.colors.primary}]}
              contentStyle={styles.placeOrderContent}
              labelStyle={styles.placeOrderLabel}>
              Place Order & Print Receipt
            </Button>
          </>
        )}
      </ScrollView>

      {/* Floating Quick Add (when cart has items) */}
      {cartItems.length > 0 && !showMenu && (
        <TouchableOpacity
          style={[styles.floatingAdd, {backgroundColor: theme.colors.tertiary}]}
          onPress={() => setShowMenu(true)}>
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Clear Cart Dialog */}
      <Portal>
        <Dialog visible={showClearDialog} onDismiss={() => setShowClearDialog(false)}>
          <Dialog.Title>Clear Order?</Dialog.Title>
          <Dialog.Content>
            <Text>This will remove all items from your current order.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowClearDialog(false)}>Cancel</Button>
            <Button textColor="#E53935" onPress={() => {clearCart(); setShowClearDialog(false);}}>
              Clear
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
  secondary = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  secondary?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.totalRow}>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={[
          bold && {fontWeight: '700'},
          secondary && {color: theme.colors.secondary},
        ]}>
        {label}
      </Text>
      <Text
        variant={bold ? 'titleMedium' : 'bodyMedium'}
        style={[
          bold && {fontWeight: '700', color: theme.colors.primary},
          secondary && {color: theme.colors.secondary},
        ]}>
        ${value.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollView: {flex: 1},
  scroll: {padding: 12, paddingBottom: 120},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyText: {color: '#757575', marginTop: 12},
  emptySubText: {color: '#BDBDBD', textAlign: 'center', marginTop: 4, paddingHorizontal: 40},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cartRowLeft: {flex: 1},
  cartItemName: {fontWeight: '500'},
  toppingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  toppingsLinkIcon: {marginRight: 6},
  toppingList: {marginTop: 4},
  toppingLine: {color: '#616161', fontSize: 12},
  qtyControls: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 8},
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {width: 28, textAlign: 'center', fontWeight: '600', fontSize: 15},
  lineTotal: {width: 64, textAlign: 'right', fontWeight: '600'},
  addMoreBtn: {marginTop: 6, marginBottom: 4},
  divider: {marginVertical: 12},
  totalsCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 14,
  },
  totalsTitle: {fontWeight: '700', color: '#424242'},
  totalRow: {flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3},
  noteInput: {marginBottom: 20},
  placeOrderBtn: {borderRadius: 12},
  placeOrderContent: {height: 52},
  placeOrderLabel: {fontSize: 16, fontWeight: '700'},
  quickAdd: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickFilterLabel: {marginTop: 4, marginBottom: 6},
  quickCategoryScroll: {flexGrow: 0, marginBottom: 8},
  quickCategoryRow: {flexDirection: 'row', alignItems: 'center', paddingRight: 8},
  quickCatChip: {marginRight: 8, height: 32},
  quickSearch: {marginBottom: 8, marginTop: 4},
  quickChipList: {minHeight: 72, maxHeight: 88},
  quickChips: {paddingVertical: 4},
  quickChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 90,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  quickChipName: {fontWeight: '600', marginBottom: 2},
  quickChipHint: {color: '#757575', fontSize: 10, marginTop: 2},
  floatingAdd: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
