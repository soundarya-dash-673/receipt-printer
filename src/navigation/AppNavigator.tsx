import React from 'react';
import type {NavigatorScreenParams} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useTheme} from 'react-native-paper';
import {View, Text, StyleSheet, Platform, ActivityIndicator} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import MenuScreen from '../screens/MenuScreen';
import MenuItemFormScreen from '../screens/MenuItemFormScreen';
import CustomizeItemScreen from '../screens/CustomizeItemScreen';
import CartScreen from '../screens/CartScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import {useApp} from '../context/AppContext';
import {useAuth} from '../context/AuthContext';

// ─── Stack Param Lists ────────────────────────────────────────────────────────

export type MenuStackParamList = {
  MenuList: undefined;
  MenuItemForm: {itemId?: string};
  MenuItemCustomize: {
    itemId: string;
    replaceCartLineId?: string;
    initialSelectedIds?: string[];
  };
};

export type CartStackParamList = {
  Cart: undefined;
  Receipt: {orderId: string};
  MenuItemCustomize: {
    itemId: string;
    replaceCartLineId?: string;
    initialSelectedIds?: string[];
  };
};

export type HistoryStackParamList = {
  OrderHistory: undefined;
  Receipt: {orderId: string};
};

export type TabParamList = {
  MenuTab: NavigatorScreenParams<MenuStackParamList>;
  CartTab: NavigatorScreenParams<CartStackParamList>;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList>;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

// ─── Stack Navigators ─────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();

const MenuStack = createNativeStackNavigator<MenuStackParamList>();
function MenuStackNavigator() {
  const theme = useTheme();
  return (
    <MenuStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.primary},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: 'bold'},
      }}>
      <MenuStack.Screen name="MenuList" component={MenuScreen} options={{title: 'Menu Items'}} />
      <MenuStack.Screen
        name="MenuItemForm"
        component={MenuItemFormScreen}
        options={({route}) => ({title: route.params?.itemId ? 'Edit Item' : 'Add Item'})}
      />
      <MenuStack.Screen
        name="MenuItemCustomize"
        component={CustomizeItemScreen}
        options={{title: 'Ingredients'}}
      />
    </MenuStack.Navigator>
  );
}

const CartStack = createNativeStackNavigator<CartStackParamList>();
function CartStackNavigator() {
  const theme = useTheme();
  return (
    <CartStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.primary},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: 'bold'},
      }}>
      <CartStack.Screen name="Cart" component={CartScreen} options={{title: 'Order'}} />
      <CartStack.Screen name="Receipt" component={ReceiptScreen} options={{title: 'Receipt'}} />
      <CartStack.Screen
        name="MenuItemCustomize"
        component={CustomizeItemScreen}
        options={{title: 'Ingredients'}}
      />
    </CartStack.Navigator>
  );
}

const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
function HistoryStackNavigator() {
  const theme = useTheme();
  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.primary},
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: 'bold'},
      }}>
      <HistoryStack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{title: 'Order History'}}
      />
      <HistoryStack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{title: 'Receipt'}}
      />
    </HistoryStack.Navigator>
  );
}

// ─── Badge Component ──────────────────────────────────────────────────────────

function CartBadge({count}: {count: number}) {
  if (count === 0) {return null;}
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

function MainTabNavigator() {
  const theme = useTheme();
  const {cartItems} = useApp();
  const cartCount = cartItems.reduce((s, c) => s + c.quantity, 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#E8E0D8',
          paddingTop: 6,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: {width: 0, height: -2},
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            default: {elevation: 8},
          }),
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600', letterSpacing: 0.2},
      }}>
      <Tab.Screen
        name="MenuTab"
        component={MenuStackNavigator}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="food-fork-drink" color={color} size={size} />
          ),
        }}
        listeners={({navigation}) => ({
          tabPress: () => {
            navigation.navigate('MenuTab', {screen: 'MenuList'});
          },
        })}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStackNavigator}
        options={{
          tabBarLabel: 'Order',
          tabBarIcon: ({color, size}) => (
            <View>
              <MaterialCommunityIcons name="cart" color={color} size={size} />
              <CartBadge count={cartCount} />
            </View>
          ),
        }}
        listeners={({navigation}) => ({
          tabPress: () => {
            navigation.navigate('CartTab', {screen: 'Cart'});
          },
        })}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="history" color={color} size={size} />
          ),
        }}
        listeners={({navigation}) => ({
          tabPress: () => {
            navigation.navigate('HistoryTab', {screen: 'OrderHistory'});
          },
        })}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          headerShown: true,
          headerStyle: {backgroundColor: theme.colors.primary},
          headerTintColor: '#fff',
          headerTitle: 'Settings',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
        listeners={({navigation}) => ({
          tabPress: () => {
            navigation.navigate('SettingsTab');
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const theme = useTheme();
  const {isReady, isAuthenticated} = useAuth();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{headerShown: false, animation: 'fade'}}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
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
