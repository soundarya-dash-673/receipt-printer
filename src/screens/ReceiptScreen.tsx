import React, {useState, useCallback} from 'react';
import {View, StyleSheet, Platform, Alert} from 'react-native';
import {Text, Button, useTheme, Snackbar, Surface} from 'react-native-paper';
import {useRoute, RouteProp, useNavigation, useFocusEffect} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {useApp, Order} from '../context/AppContext';
import {buildReceiptHTML} from '../utils/receiptTemplate';
import {exportReceiptAsPDF} from '../utils/pdfPrint';
import {printReceiptViaBluetooth, isBluetoothReadyToPrint} from '../utils/bluetoothPrint';

type ReceiptRoute = RouteProp<{Receipt: {orderId: string}}, 'Receipt'>;

export default function ReceiptScreen() {
  const theme = useTheme();
  const route = useRoute<ReceiptRoute>();
  const navigation = useNavigation();
  const {orders} = useApp();

  const order = orders.find(o => o.id === route.params.orderId);

  const [pdfLoading, setPDFLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{visible: boolean; message: string; error?: boolean}>({
    visible: false,
    message: '',
  });
  const [printing, setPrinting] = useState(false);
  const [btReady, setBtReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (Platform.OS !== 'android') {
          if (!cancelled) {
            setBtReady(false);
          }
          return;
        }
        const ok = await isBluetoothReadyToPrint();
        if (!cancelled) {
          setBtReady(ok);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const goToSettings = useCallback(() => {
    const tabNav = navigation.getParent()?.getParent?.();
    if (tabNav) {
      tabNav.navigate('SettingsTab' as never);
    }
  }, [navigation]);

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#EF5350" />
        <Text variant="titleMedium" style={styles.errorText}>Order not found</Text>
        <Button onPress={() => navigation.goBack()} mode="outlined">
          Go Back
        </Button>
      </View>
    );
  }

  const handleExportPDF = async () => {
    setPDFLoading(true);
    try {
      const result = await exportReceiptAsPDF(order);
      if (!result.success && result.error) {
        setSnackbar({visible: true, message: `PDF failed: ${result.error}`, error: true});
      } else {
        setSnackbar({visible: true, message: 'Receipt exported successfully!'});
      }
    } finally {
      setPDFLoading(false);
    }
  };

  type PrintChoice = 'kitchen' | 'customer' | 'both' | null;

  const askPrintChoice = () =>
    new Promise<PrintChoice>(resolve => {
      Alert.alert(
        'Print Receipt',
        'Which copy would you like to print?',
        [
          {text: 'Cancel', style: 'cancel', onPress: () => resolve(null)},
          {text: 'Kitchen Copy', onPress: () => resolve('kitchen')},
          {text: 'Customer Copy', onPress: () => resolve('customer')},
          {text: 'Both', onPress: () => resolve('both')},
        ],
        {cancelable: true, onDismiss: () => resolve(null)},
      );
    });

  const handleBluetoothPrint = async () => {
    if (Platform.OS !== 'android') {
      setSnackbar({
        visible: true,
        message: 'Bluetooth printing is only available on Android.',
        error: true,
      });
      return;
    }
    const ready = await isBluetoothReadyToPrint();
    if (!ready) {
      setSnackbar({
        visible: true,
        message: 'Connect your printer in Settings → Bluetooth printer, then try again.',
        error: true,
      });
      return;
    }

    const choice = await askPrintChoice();
    if (!choice) {
      return;
    }

    setPrinting(true);
    try {
      if (choice === 'kitchen' || choice === 'both') {
        const kitchen = await printReceiptViaBluetooth(order, 'KITCHEN COPY');
        if (!kitchen.success) {
          setSnackbar({visible: true, message: kitchen.error ?? 'Kitchen copy failed', error: true});
          return;
        }
        if (choice === 'kitchen') {
          setSnackbar({visible: true, message: 'Kitchen copy printed.'});
          return;
        }
      }

      if (choice === 'customer' || choice === 'both') {
        const customer = await printReceiptViaBluetooth(order, 'CUSTOMER COPY');
        if (!customer.success) {
          setSnackbar({visible: true, message: customer.error ?? 'Customer copy failed', error: true});
          return;
        }
        setSnackbar({
          visible: true,
          message: choice === 'both' ? 'Kitchen & customer copies printed!' : 'Customer copy printed.',
        });
      }
    } finally {
      setPrinting(false);
    }
  };

  const receiptHTML = buildReceiptHTML(order);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Surface style={styles.actionBar} elevation={2}>
        <Button
          mode="contained"
          icon="file-pdf-box"
          onPress={handleExportPDF}
          loading={pdfLoading}
          disabled={pdfLoading || printing}
          style={[styles.actionBtn, {backgroundColor: '#E53935'}]}
          contentStyle={styles.btnContent}>
          PDF / Share
        </Button>
        {Platform.OS === 'android' ? (
          <Button
            mode="contained"
            icon="bluetooth-audio"
            onPress={handleBluetoothPrint}
            loading={printing}
            disabled={pdfLoading || printing}
            style={[styles.actionBtn, {backgroundColor: theme.colors.primary}]}
            contentStyle={styles.btnContent}>
            BT Print
          </Button>
        ) : null}
      </Surface>

      {Platform.OS === 'android' ? (
        <View
          style={[
            styles.hintBar,
            {backgroundColor: btReady ? '#E8F5E9' : '#FFF3E0', borderBottomColor: btReady ? '#C8E6C9' : '#FFE0B2'},
          ]}>
          <MaterialCommunityIcons
            name={btReady ? 'check-circle' : 'information'}
            size={18}
            color={btReady ? '#2E7D32' : '#E65100'}
          />
          <Text
            variant="bodySmall"
            style={{
              color: btReady ? '#2E7D32' : '#E65100',
              marginLeft: 8,
              flex: 1,
            }}>
            {btReady
              ? 'Bluetooth printer connected — you can print.'
              : 'Set up your printer under Settings → Bluetooth printer.'}
          </Text>
          {!btReady ? (
            <Button mode="text" compact onPress={goToSettings} textColor="#E65100">
              Open Settings
            </Button>
          ) : null}
        </View>
      ) : null}

      <WebView
        source={{html: receiptHTML}}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({...s, visible: false}))}
        duration={4000}
        style={{backgroundColor: snackbar.error ? '#C62828' : '#2E7D32'}}
        action={
          snackbar.error && snackbar.message.includes('Settings')
            ? {label: 'Settings', onPress: goToSettings}
            : undefined
        }>
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  errorContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16},
  errorText: {color: '#757575'},
  actionBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  actionBtn: {flex: 1, borderRadius: 8},
  btnContent: {height: 44},
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  webview: {flex: 1, backgroundColor: '#f5f5f5'},
});
