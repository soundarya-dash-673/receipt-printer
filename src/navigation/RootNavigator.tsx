import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from 'react-native-paper';

import CartTabBarIcon from '../components/CartTabBarIcon';
import {tabBarOptions} from '../theme/foodReceiptLayout';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeOrdersScreen from '../screens/HomeOrdersScreen';
import NewOrderScreen from '../screens/NewOrderScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsHomeScreen from '../screens/SettingsHomeScreen';
import BrandingSetupScreen from '../screens/BrandingSetupScreen';
import PrinterSetupScreen from '../screens/PrinterSetupScreen';
import StaffManagementScreen from '../screens/StaffManagementScreen';
import ToppingsSetupScreen from '../screens/ToppingsSetupScreen';

import type {
  RootStackParamList,
  HomeStackParamList,
  OrderStackParamList,
  SettingsStackParamList,
  MainTabParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OrderStack = createNativeStackNavigator<OrderStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const stackHeader = (primary: string) => ({
  headerStyle: {backgroundColor: primary},
  headerTintColor: '#fff',
  headerTitleStyle: {fontWeight: '700' as const},
});

function HomeStackNav() {
  const theme = useTheme();
  const h = stackHeader(theme.colors.primary);
  return (
    <HomeStack.Navigator screenOptions={h}>
      <HomeStack.Screen name="HomeOrders" component={HomeOrdersScreen} options={{title: 'Order history'}} />
      <HomeStack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{title: 'Receipt'}} />
    </HomeStack.Navigator>
  );
}

function OrderStackNav() {
  const theme = useTheme();
  const h = stackHeader(theme.colors.primary);
  return (
    <OrderStack.Navigator screenOptions={h}>
      <OrderStack.Screen name="NewOrder" component={NewOrderScreen} options={{title: 'Cart'}} />
      <OrderStack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{title: 'Checkout'}} />
      <OrderStack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} options={{title: 'Receipt'}} />
    </OrderStack.Navigator>
  );
}

function SettingsStackNav() {
  const theme = useTheme();
  const h = stackHeader(theme.colors.primary);
  return (
    <SettingsStack.Navigator screenOptions={h}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsHomeScreen} options={{title: 'Settings'}} />
      <SettingsStack.Screen name="BrandingSetup" component={BrandingSetupScreen} options={{title: 'Branding'}} />
      <SettingsStack.Screen name="PrinterSetup" component={PrinterSetupScreen} options={{title: 'Printers'}} />
      <SettingsStack.Screen name="ToppingsSetup" component={ToppingsSetupScreen} options={{title: 'Toppings'}} />
      <SettingsStack.Screen name="StaffManagement" component={StaffManagementScreen} options={{title: 'Staff'}} />
    </SettingsStack.Navigator>
  );
}

function MainTabs() {
  const theme = useTheme();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(theme)}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({color, size}) => <MaterialCommunityIcons name="receipt" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="OrderTab"
        component={OrderStackNav}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({color, size}) => <CartTabBarIcon color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Reports',
          tabBarIcon: ({color, size}) => <MaterialCommunityIcons name="chart-box" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNav}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({color, size}) => <MaterialCommunityIcons name="cog" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="Splash" screenOptions={{headerShown: false}}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Main" component={MainTabs} />
    </RootStack.Navigator>
  );
}
