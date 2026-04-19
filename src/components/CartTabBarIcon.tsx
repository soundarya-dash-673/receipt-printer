import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useDraftOrderStore} from '../stores/draftOrderStore';

type Props = {
  color: string;
  size: number;
};

/** Cart tab icon with quantity badge — same pattern as the original Food Receipt app. */
export default function CartTabBarIcon({color, size}: Props) {
  const count = useDraftOrderStore(s => s.lines.reduce((sum, line) => sum + line.quantity, 0));

  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="cart" color={color} size={size} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : String(count)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
