import React, {useState, useEffect} from 'react';
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
} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useApp} from '../context/AppContext';
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
    const data = {
      name: name.trim(),
      price: parseFloat(parseFloat(price).toFixed(2)),
      category: category.trim(),
      description: description.trim(),
    };
    if (editingItem) {
      updateMenuItem({...editingItem, ...data});
    } else {
      addMenuItem(data);
    }
    navigation.goBack();
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
  buttons: {flexDirection: 'row', gap: 12, marginTop: 24},
  btn: {flex: 1},
});
