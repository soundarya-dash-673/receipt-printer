import React, {useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  useTheme,
  Text,
  HelperText,
  Chip,
  IconButton,
} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {v4 as uuidv4} from 'uuid';
import {useApp, MenuTopping} from '../context/AppContext';
import {MenuStackParamList} from '../navigation/AppNavigator';

type RouteType = RouteProp<MenuStackParamList, 'MenuItemForm'>;
type NavigationProp = NativeStackNavigationProp<MenuStackParamList, 'MenuItemForm'>;

const SUGGESTED_CATEGORIES = ['Starters', 'Mains', 'Sides', 'Desserts', 'Drinks', 'Specials'];

export default function MenuItemFormScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const {menuItems, addMenuItem, updateMenuItem} = useApp();

  const editingItem = route.params?.itemId
    ? menuItems.find(m => m.id === route.params.itemId)
    : undefined;

  const [name, setName] = useState(editingItem?.name ?? '');
  const [price, setPrice] = useState(editingItem?.price.toString() ?? '');
  const [category, setCategory] = useState(editingItem?.category ?? '');
  const [description, setDescription] = useState(editingItem?.description ?? '');
  const [toppings, setToppings] = useState<MenuTopping[]>(() =>
    editingItem?.toppings?.length ? editingItem.toppings.map(t => ({...t})) : [],
  );
  const [errors, setErrors] = useState<{name?: string; price?: string; category?: string}>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) {newErrors.name = 'Item name is required';}
    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Enter a valid price';
    }
    if (!category.trim()) {newErrors.category = 'Category is required';}
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {return;}
    const cleanedToppings = toppings
      .filter(t => t.name.trim().length > 0)
      .map(t => ({
        id: t.id,
        name: t.name.trim(),
        price: Math.max(0, Math.round((parseFloat(String(t.price)) || 0) * 100) / 100),
      }));
    const data = {
      name: name.trim(),
      price: parseFloat(parseFloat(price).toFixed(2)),
      category: category.trim(),
      description: description.trim(),
      toppings: cleanedToppings,
    };
    if (editingItem) {
      updateMenuItem({...editingItem, ...data});
    } else {
      addMenuItem(data);
    }
    navigation.goBack();
  };

  const addToppingRow = () => {
    setToppings(prev => [...prev, {id: uuidv4(), name: '', price: 0}]);
  };

  const updateTopping = (index: number, patch: Partial<MenuTopping>) => {
    setToppings(prev =>
      prev.map((t, i) => (i === index ? {...t, ...patch} : t)),
    );
  };

  const removeTopping = (index: number) => {
    setToppings(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, {backgroundColor: theme.colors.background}]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">

        {/* Name */}
        <TextInput
          label="Item Name *"
          value={name}
          onChangeText={t => {setName(t); setErrors(e => ({...e, name: undefined}));}}
          mode="outlined"
          style={styles.input}
          error={!!errors.name}
          left={<TextInput.Icon icon="food" />}
        />
        <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>

        {/* Price */}
        <TextInput
          label="Price ($) *"
          value={price}
          onChangeText={t => {setPrice(t); setErrors(e => ({...e, price: undefined}));}}
          mode="outlined"
          style={styles.input}
          keyboardType="decimal-pad"
          error={!!errors.price}
          left={<TextInput.Icon icon="currency-usd" />}
        />
        <HelperText type="error" visible={!!errors.price}>{errors.price}</HelperText>

        {/* Category */}
        <TextInput
          label="Category *"
          value={category}
          onChangeText={t => {setCategory(t); setErrors(e => ({...e, category: undefined}));}}
          mode="outlined"
          style={styles.input}
          error={!!errors.category}
          left={<TextInput.Icon icon="tag" />}
        />
        <HelperText type="error" visible={!!errors.category}>{errors.category}</HelperText>

        {/* Category Suggestions */}
        <Text variant="labelMedium" style={styles.suggestLabel}>Suggested categories:</Text>
        <View style={styles.chipRow}>
          {SUGGESTED_CATEGORIES.map(cat => (
            <Chip
              key={cat}
              onPress={() => {setCategory(cat); setErrors(e => ({...e, category: undefined}));}}
              selected={category === cat}
              style={[
                styles.chip,
                category === cat && {backgroundColor: theme.colors.primary},
              ]}
              textStyle={{color: category === cat ? '#fff' : undefined}}>
              {cat}
            </Chip>
          ))}
        </View>

        {/* Description */}
        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
          left={<TextInput.Icon icon="text" />}
        />

        <Text variant="titleSmall" style={styles.toppingsTitle}>
          Toppings (optional)
        </Text>
        <Text variant="bodySmall" style={styles.toppingsHint}>
          Set price to 0 for a free topping. Customers choose these when adding the item to the order.
        </Text>

        {toppings.map((t, index) => (
          <View key={t.id} style={[styles.toppingRow, {borderColor: theme.colors.outline}]}>
            <View style={styles.toppingFields}>
              <TextInput
                label="Topping name"
                value={t.name}
                onChangeText={txt => updateTopping(index, {name: txt})}
                mode="outlined"
                dense
                style={styles.toppingName}
                left={<TextInput.Icon icon="food-variant" />}
              />
              <TextInput
                label="Price ($)"
                value={t.price === 0 ? '' : String(t.price)}
                onChangeText={txt => {
                  const n = parseFloat(txt);
                  updateTopping(index, {
                    price: txt.trim() === '' || Number.isNaN(n) ? 0 : Math.max(0, n),
                  });
                }}
                mode="outlined"
                dense
                keyboardType="decimal-pad"
                style={styles.toppingPrice}
                left={<TextInput.Icon icon="cash" />}
              />
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={() => removeTopping(index)}
              style={styles.toppingRemove}
            />
          </View>
        ))}

        <Button mode="outlined" icon="plus" onPress={addToppingRow} style={styles.addToppingBtn}>
          Add topping
        </Button>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.btn}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.btn, {backgroundColor: theme.colors.primary}]}>
            {editingItem ? 'Update Item' : 'Add Item'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 40},
  input: {marginBottom: 0},
  suggestLabel: {marginTop: 4, marginBottom: 8, color: '#757575'},
  chipRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  chip: {},
  toppingsTitle: {marginTop: 20, marginBottom: 4, fontWeight: '600'},
  toppingsHint: {color: '#757575', marginBottom: 12, lineHeight: 18},
  toppingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
  },
  toppingFields: {flex: 1, flexDirection: 'row', flexWrap: 'wrap'},
  toppingName: {flex: 1, minWidth: 140, marginRight: 8},
  toppingPrice: {width: 120},
  toppingRemove: {margin: 0},
  addToppingBtn: {marginBottom: 8},
  buttons: {flexDirection: 'row', gap: 12, marginTop: 24},
  btn: {flex: 1},
});
