import React, {useMemo, useState, useCallback, useLayoutEffect} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Text, Button, Checkbox, useTheme, Divider} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useApp, MenuTopping, SelectedTopping, unitPriceForLine} from '../context/AppContext';
import {formatToppingPriceLabel} from '../utils/toppingPrice';

type CustomizeNavParams = {
  MenuItemCustomize: {
    itemId: string;
    replaceCartLineId?: string;
    initialSelectedIds?: string[];
  };
};
type RouteT = RouteProp<CustomizeNavParams, 'MenuItemCustomize'>;
type Nav = NativeStackNavigationProp<CustomizeNavParams, 'MenuItemCustomize'>;

function buildSelectedToppings(
  toppingList: MenuTopping[],
  selectedIds: Set<string>,
): SelectedTopping[] {
  const byId = new Map<string, SelectedTopping>();
  for (const t of toppingList) {
    if (t.required) {
      byId.set(t.id, {
        id: t.id,
        name: t.name,
        price: Number(t.price) || 0,
      });
    }
  }
  for (const t of toppingList) {
    if (!t.required && selectedIds.has(t.id)) {
      byId.set(t.id, {
        id: t.id,
        name: t.name,
        price: Number(t.price) || 0,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export default function CustomizeItemScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const {menuItems, addToCart, replaceCartLine} = useApp();

  const replaceCartLineId = route.params.replaceCartLineId;
  const initialSelectedIds = route.params.initialSelectedIds;

  const menuItem = useMemo(
    () => menuItems.find(m => m.id === route.params.itemId),
    [menuItems, route.params.itemId],
  );

  const toppingList = menuItem?.toppings ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: replaceCartLineId ? 'Edit ingredients' : 'Customize',
    });
  }, [navigation, replaceCartLineId]);

  useLayoutEffect(() => {
    if (!menuItem?.toppings?.length) {
      setSelectedIds(new Set());
      return;
    }
    const requiredIds = menuItem.toppings.filter(t => t.required).map(t => t.id);

    if (replaceCartLineId != null) {
      const fromLine =
        initialSelectedIds != null
          ? initialSelectedIds
          : menuItem.toppings
              .filter(t => t.includedByDefault || t.required)
              .map(t => t.id);
      setSelectedIds(new Set([...new Set([...fromLine, ...requiredIds])]));
      return;
    }

    const defaults = menuItem.toppings
      .filter(t => t.includedByDefault || t.required)
      .map(t => t.id);
    setSelectedIds(new Set(defaults));
  }, [menuItem?.id, menuItem?.toppings, replaceCartLineId, initialSelectedIds]);

  const toggle = useCallback(
    (id: string) => {
      if (toppingList.find(t => t.id === id)?.required) {
        return;
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    [toppingList],
  );

  const selectedToppings: SelectedTopping[] = useMemo(
    () => buildSelectedToppings(toppingList, selectedIds),
    [toppingList, selectedIds],
  );

  const unitPrice = menuItem ? unitPriceForLine(menuItem, selectedToppings) : 0;

  const requiredToppings = useMemo(
    () => toppingList.filter(t => t.required),
    [toppingList],
  );
  const standardOptional = useMemo(
    () => toppingList.filter(t => t.includedByDefault && !t.required),
    [toppingList],
  );
  const extraToppings = useMemo(
    () => toppingList.filter(t => !t.includedByDefault && !t.required),
    [toppingList],
  );

  const handleConfirm = () => {
    if (!menuItem) {
      return;
    }
    if (replaceCartLineId) {
      replaceCartLine(replaceCartLineId, menuItem, selectedToppings);
    } else {
      addToCart(menuItem, selectedToppings);
    }
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
          This item has no ingredients or add-ons. It will be added at the base price.
        </Text>
        <Button
          mode="contained"
          onPress={() => {
            if (replaceCartLineId) {
              replaceCartLine(replaceCartLineId, menuItem, []);
            } else {
              addToCart(menuItem, []);
            }
            navigation.goBack();
          }}
          style={[styles.cta, {backgroundColor: theme.colors.primary}]}>
          {replaceCartLineId ? 'Save line' : 'Add to order'}
        </Button>
      </View>
    );
  }

  const renderPrice = (price: number) => (
    <Text
      variant="labelMedium"
      style={{
        color: Number(price) <= 0 ? theme.colors.tertiary : theme.colors.primary,
      }}>
      {formatToppingPriceLabel(price)}
    </Text>
  );

  return (
    <ScrollView
      style={[styles.flex, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.title}>
        {menuItem.name}
      </Text>
      <Text variant="bodySmall" style={[styles.sub, {color: theme.colors.secondary}]}>
        Base ${menuItem.price.toFixed(2)} · required items stay on the dish
      </Text>

      <Divider style={styles.divider} />

      {requiredToppings.length > 0 ? (
        <>
          <Text variant="labelLarge" style={[styles.sectionLabel, {color: theme.colors.primary}]}>
            Always included
          </Text>
          {requiredToppings.map(t => (
            <View
              key={t.id}
              style={[styles.row, styles.rowLocked, {backgroundColor: theme.colors.surface}]}>
              <MaterialCommunityIcons name="lock" size={22} color={theme.colors.outline} />
              <View style={styles.rowText}>
                <Text variant="bodyLarge">{t.name}</Text>
                <Text variant="labelSmall" style={{color: theme.colors.onSurfaceVariant}}>
                  Cannot remove
                </Text>
                {renderPrice(Number(t.price) || 0)}
              </View>
            </View>
          ))}
        </>
      ) : null}

      {standardOptional.length > 0 ? (
        <>
          <Text
            variant="labelLarge"
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.primary,
                marginTop: requiredToppings.length ? 12 : 0,
              },
            ]}>
            Standard (uncheck to remove)
          </Text>
          {standardOptional.map(t => {
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
                  {renderPrice(Number(t.price) || 0)}
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
              {
                color: theme.colors.primary,
                marginTop:
                  requiredToppings.length || standardOptional.length ? 12 : 0,
              },
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
                  {renderPrice(Number(t.price) || 0)}
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
        icon={replaceCartLineId ? 'check' : 'cart-plus'}
        onPress={handleConfirm}
        style={[styles.cta, {backgroundColor: theme.colors.primary}]}
        contentStyle={styles.ctaContent}>
        {replaceCartLineId ? 'Update order line' : 'Add to order'}
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
  rowLocked: {paddingLeft: 12},
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
