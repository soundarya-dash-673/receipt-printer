import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Portal,
  Dialog,
  RadioButton,
  Snackbar,
  Surface,
} from 'react-native-paper';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import * as orderRepo from '../data/repositories/orderRepository';
import * as settingsRepo from '../data/repositories/settingsRepository';
import {buildReceiptHTML, buildReceiptPayload, type ReceiptPayload} from '../utils/receiptTemplate';
import {exportReceiptAsPDF} from '../utils/pdfPrint';
import {
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  printReceiptViaBluetooth,
  enableBluetooth,
} from '../utils/bluetoothPrint';
import type {HomeStackParamList, OrderStackParamList} from '../navigation/types';

type ReceiptRoute = RouteProp<HomeStackParamList & OrderStackParamList, 'ReceiptDetail'>;

export default function ReceiptDetailScreen() {
  const theme = useTheme();
  const route = useRoute<ReceiptRoute>();
  const navigation = useNavigation();
  const {orderId} = route.params;

  const [payload, setPayload] = useState<ReceiptPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [pdfLoading, setPDFLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{visible: boolean; message: string; error?: boolean}>({
    visible: false,
    message: '',
  });

  const [btDialogVisible, setBTDialogVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [printers, setPrinters] = useState<{name: string; address: string}[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [full, settings] = await Promise.all([
        orderRepo.getOrderById(orderId),
        settingsRepo.getSettings(),
      ]);
      if (!full) {
        setPayload(null);
        return;
      }
      setPayload(buildReceiptPayload(full, settings));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      disconnectPrinter();
    };
  }, []);

  const receiptHTML = useMemo(
    () => (payload ? buildReceiptHTML(payload) : '<html><body></body></html>'),
    [payload],
  );

  const handleExportPDF = async () => {
    if (!payload) {
      return;
    }
    setPDFLoading(true);
    try {
      const result = await exportReceiptAsPDF(payload);
      if (!result.success && result.error) {
        setSnackbar({visible: true, message: `PDF failed: ${result.error}`, error: true});
      } else {
        setSnackbar({visible: true, message: 'Receipt exported!'});
      }
    } finally {
      setPDFLoading(false);
    }
  };

  const handleOpenBTDialog = async () => {
    setBTDialogVisible(true);
    await doScan();
  };

  const doScan = async () => {
    setScanning(true);
    setPrinters([]);
    try {
      if (Platform.OS === 'android') {
        await enableBluetooth();
      }
      const {printers: found, error} = await scanForPrinters();
      if (error) {
        setSnackbar({visible: true, message: error, error: true});
      }
      setPrinters(found);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (address: string) => {
    setConnecting(true);
    try {
      const result = await connectToPrinter(address);
      if (result.success) {
        setConnectedAddress(address);
        setSnackbar({visible: true, message: 'Printer connected!'});
      } else {
        setSnackbar({visible: true, message: result.error ?? 'Connection failed', error: true});
      }
    } finally {
      setConnecting(false);
    }
  };

  const handlePrint = async () => {
    if (!payload) {
      return;
    }
    setPrinting(true);
    setBTDialogVisible(false);
    try {
      const result = await printReceiptViaBluetooth(payload);
      if (result.success) {
        setSnackbar({visible: true, message: 'Printed!'});
      } else {
        setSnackbar({visible: true, message: result.error ?? 'Print failed', error: true});
      }
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!payload) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color="#EF5350" />
        <Text variant="titleMedium" style={{marginTop: 12}}>
          Order not found
        </Text>
        <Button onPress={() => navigation.goBack()} mode="outlined">
          Go back
        </Button>
      </View>
    );
  }

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
        <Button
          mode="contained"
          icon="bluetooth-audio"
          onPress={handleOpenBTDialog}
          loading={printing}
          disabled={pdfLoading || printing}
          style={[styles.actionBtn, {backgroundColor: theme.colors.primary}]}
          contentStyle={styles.btnContent}>
          BT Print
        </Button>
      </Surface>

      {connectedAddress ? (
        <View style={[styles.btStatus, {backgroundColor: '#E8F5E9'}]}>
          <MaterialCommunityIcons name="bluetooth-connect" size={16} color="#2E7D32" />
          <Text variant="bodySmall" style={{color: '#2E7D32', marginLeft: 6}}>
            {printers.find(p => p.address === connectedAddress)?.name ?? connectedAddress}
          </Text>
        </View>
      ) : null}

      <WebView source={{html: receiptHTML}} style={styles.webview} scrollEnabled />

      <Portal>
        <Dialog visible={btDialogVisible} onDismiss={() => setBTDialogVisible(false)}>
          <Dialog.Title>Bluetooth printer</Dialog.Title>
          <Dialog.Content>
            {scanning ? (
              <View style={styles.scanningRow}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.scanningText}>Scanning…</Text>
              </View>
            ) : printers.length === 0 ? (
              <Text>No printers found. Pair your 58mm device first.</Text>
            ) : (
              <RadioButton.Group value={selectedPrinter} onValueChange={setSelectedPrinter}>
                {printers.map(p => (
                  <RadioButton.Item
                    key={p.address}
                    label={`${p.name}\n${p.address}`}
                    value={p.address}
                    labelStyle={{fontSize: 13}}
                  />
                ))}
              </RadioButton.Group>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBTDialogVisible(false)}>Close</Button>
            <Button onPress={doScan} disabled={scanning}>
              Rescan
            </Button>
            {connectedAddress && selectedPrinter === connectedAddress ? (
              <Button mode="contained" onPress={handlePrint} buttonColor={theme.colors.primary}>
                Print
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleConnect(selectedPrinter)}
                disabled={!selectedPrinter || connecting}
                loading={connecting}
                buttonColor={theme.colors.primary}>
                Connect
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({...s, visible: false}))}
        duration={3000}
        style={{backgroundColor: snackbar.error ? '#C62828' : '#2E7D32'}}>
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12},
  container: {flex: 1},
  actionBar: {flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff'},
  actionBtn: {flex: 1, borderRadius: 8},
  btnContent: {height: 44},
  btStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  webview: {flex: 1, backgroundColor: '#E8ECF1'},
  scanningRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
  scanningText: {color: '#555'},
});
