import React, {useMemo, useState, useCallback, useLayoutEffect} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Text, Button, Checkbox, useTheme, Divider} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useApp, SelectedTopping, unitPriceForLine} from '../context/AppContext';
import {formatToppingPriceLabel} from '../utils/toppingPrice';

type CustomizeNavParams = {MenuItemCustomize: {itemId: string}};
type RouteT = RouteProp<CustomizeNavParams, 'MenuItemCustomize'>;
type Nav = NativeStackNavigationProp<CustomizeNavParams, 'MenuItemCustomize'>;

export default function CustomizeItemScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const {menuItems, addToCart} = useApp();

  const menuItem = useMemo(
    () => menuItems.find(m => m.id === route.params.itemId),
    [menuItems, route.params.itemId],
  );

  const toppingList = menuItem?.toppings ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useLayoutEffect(() => {
    if (!menuItem?.toppings?.length) {
      setSelectedIds(new Set());
      return;
    }
    const defaults = menuItem.toppings
      .filter(t => t.includedByDefault)
      .map(t => t.id);
    setSelectedIds(new Set(defaults));
  }, [menuItem?.id]);

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedToppings: SelectedTopping[] = useMemo(() => {
    if (!menuItem) {
      return [];
    }
    return toppingList
      .filter(t => selectedIds.has(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        price: Number(t.price) || 0,
      }));
  }, [menuItem, toppingList, selectedIds]);

  const unitPrice = menuItem
    ? unitPriceForLine(menuItem, selectedToppings)
    : 0;

  const standardToppings = useMemo(
    () => toppingList.filter(t => t.includedByDefault),
    [toppingList],
  );
  const extraToppings = useMemo(
    () => toppingList.filter(t => !t.includedByDefault),
    [toppingList],
  );

  const handleAdd = () => {
    if (!menuItem) {
      return;
    }
    addToCart(menuItem, selectedToppings);
    navigation.goBack();
  };

  if (!menuItem) {
    return (
      <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
        <Text variant="bodyLarge">Item not found.</Text>
        <Button mode="contained" onPress={() => navigation.goBack()} style={{marginTop: 16}}>
          Go back
        </Button>
      </View>
    );
  }

  if (toppingList.length === 0) {
    return (
      <View style={[styles.center, {backgroundColor: theme.colors.background}]}>
        <Text variant="bodyMedium" style={{textAlign: 'center', paddingHorizontal: 24}}>
          This item has no toppings. It will be added with the base price.
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            addToCart(menuItem, []);
            navigation.goBack();
          }}
          style={[styles.cta, {backgroundColor: theme.colors.primary}]}>
          Add to order
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.title}>
        {menuItem.name}
      </Text>
      <Text variant="bodySmall" style={[styles.sub, {color: theme.colors.secondary}]}>
        Base ${menuItem.price.toFixed(2)} · adjust standard items or add extras
      </Text>

      <Divider style={styles.divider} />

      {standardToppings.length > 0 ? (
        <>
          <Text variant="labelLarge" style={[styles.sectionLabel, {color: theme.colors.primary}]}>
            Standard (included — uncheck to remove)
          </Text>
          {standardToppings.map(t => {
            const checked = selectedIds.has(t.id);
            return (
              <View
                key={t.id}
                style={[styles.row, {backgroundColor: theme.colors.surface}]}>
                <Checkbox
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => toggle(t.id)}
                  color={theme.colors.primary}
                />
                <View style={styles.rowText}>
                  <Text variant="bodyLarge">{t.name}</Text>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: Number(t.price) <= 0 ? theme.colors.tertiary : theme.colors.primary,
                    }}>
                    {formatToppingPriceLabel(t.price)}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {extraToppings.length > 0 ? (
        <>
          <Text
            variant="labelLarge"
            style={[
              styles.sectionLabel,
              {color: theme.colors.primary, marginTop: standardToppings.length ? 12 : 0},
            ]}>
            Extras & add-ons
          </Text>
          {extraToppings.map(t => {
            const checked = selectedIds.has(t.id);
            return (
              <View
                key={t.id}
                style={[styles.row, {backgroundColor: theme.colors.surface}]}>
                <Checkbox
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => toggle(t.id)}
                  color={theme.colors.primary}
                />
                <View style={styles.rowText}>
                  <Text variant="bodyLarge">{t.name}</Text>
                  <Text
                    variant="labelMedium"
                    style={{
                      color: Number(t.price) <= 0 ? theme.colors.tertiary : theme.colors.primary,
                    }}>
                    {formatToppingPriceLabel(t.price)}
                  </Text>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      <View style={[styles.summary, {backgroundColor: theme.colors.surfaceVariant}]}>
        <Text variant="labelLarge">Unit price</Text>
        <Text variant="titleLarge" style={{color: theme.colors.primary, fontWeight: '700'}}>
          ${unitPrice.toFixed(2)}
        </Text>
      </View>

      <Button
        mode="contained"
        icon="cart-plus"
        onPress={handleAdd}
        style={[styles.cta, {backgroundColor: theme.colors.primary}]}
        contentStyle={styles.ctaContent}>
        Add to order
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24},
  content: {padding: 16, paddingBottom: 40},
  title: {fontWeight: '700'},
  sub: {marginTop: 4, marginBottom: 4},
  divider: {marginVertical: 12},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  rowText: {flex: 1, marginLeft: 4},
  sectionLabel: {marginBottom: 8, fontWeight: '700'},
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cta: {borderRadius: 12},
  ctaContent: {paddingVertical: 6},
});
