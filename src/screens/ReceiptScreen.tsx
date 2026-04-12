import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Divider,
  Portal,
  Dialog,
  List,
  RadioButton,
  Snackbar,
  Surface,
} from 'react-native-paper';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {useApp, Order} from '../context/AppContext';
import {buildReceiptHTML} from '../utils/receiptTemplate';
import {exportReceiptAsPDF} from '../utils/pdfPrint';
import {
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  printReceiptViaBluetooth,
  BTPrinter,
  enableBluetooth,
} from '../utils/bluetoothPrint';

// ─── Route types (works for both Cart and History stacks) ─────────────────────
type ReceiptRoute = RouteProp<{Receipt: {orderId: string}}, 'Receipt'>;

export default function ReceiptScreen() {
  const theme = useTheme();
  const route = useRoute<ReceiptRoute>();
  const navigation = useNavigation();
  const {orders} = useApp();

  const order = orders.find(o => o.id === route.params.orderId);

  // ── PDF state ──
  const [pdfLoading, setPDFLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{visible: boolean; message: string; error?: boolean}>({
    visible: false,
    message: '',
  });

  // ── BT state ──
  const [btDialogVisible, setBTDialogVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [printers, setPrinters] = useState<BTPrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [connecting, setConnecting] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    return () => {
      disconnectPrinter();
    };
  }, []);

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

  // ── PDF Export ────────────────────────────────────────────────────────────

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

  // ── Bluetooth Print ───────────────────────────────────────────────────────

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
    setPrinting(true);
    setBTDialogVisible(false);
    try {
      const result = await printReceiptViaBluetooth(order);
      if (result.success) {
        setSnackbar({visible: true, message: 'Receipt printed successfully!'});
      } else {
        setSnackbar({
          visible: true,
          message: result.error ?? 'Printing failed',
          error: true,
        });
      }
    } finally {
      setPrinting(false);
    }
  };

  const receiptHTML = buildReceiptHTML(order);

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Action Buttons */}
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

      {/* BT Connection Status */}
      {connectedAddress && (
        <View style={[styles.btStatus, {backgroundColor: '#E8F5E9'}]}>
          <MaterialCommunityIcons name="bluetooth-connect" size={16} color="#2E7D32" />
          <Text variant="bodySmall" style={{color: '#2E7D32', marginLeft: 6}}>
            Printer connected: {printers.find(p => p.address === connectedAddress)?.name ?? connectedAddress}
          </Text>
        </View>
      )}

      {/* Receipt HTML Preview */}
      <WebView
        source={{html: receiptHTML}}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />

      {/* Bluetooth Printer Dialog */}
      <Portal>
        <Dialog visible={btDialogVisible} onDismiss={() => setBTDialogVisible(false)}>
          <Dialog.Title>Select Bluetooth Printer</Dialog.Title>
          <Dialog.Content>
            {scanning ? (
              <View style={styles.scanningRow}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.scanningText}>Scanning for printers...</Text>
              </View>
            ) : printers.length === 0 ? (
              <View style={styles.noPrinters}>
                <MaterialCommunityIcons name="bluetooth-off" size={40} color="#BDBDBD" />
                <Text variant="bodyMedium" style={styles.noPrintersText}>
                  No printers found
                </Text>
                <Text variant="bodySmall" style={styles.noPrintersHint}>
                  Make sure your printer is on and in pairing mode
                </Text>
              </View>
            ) : (
              <RadioButton.Group
                value={selectedPrinter}
                onValueChange={v => setSelectedPrinter(v)}>
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
            <Button onPress={() => setBTDialogVisible(false)}>Cancel</Button>
            <Button onPress={doScan} disabled={scanning}>
              Rescan
            </Button>
            {connectedAddress && selectedPrinter === connectedAddress ? (
              <Button
                mode="contained"
                onPress={handlePrint}
                style={{backgroundColor: theme.colors.primary}}>
                Print
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleConnect(selectedPrinter)}
                disabled={!selectedPrinter || connecting}
                loading={connecting}
                style={{backgroundColor: theme.colors.primary}}>
                Connect
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
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
  btStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  webview: {flex: 1, backgroundColor: '#f5f5f5'},
  scanningRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
  scanningText: {color: '#555'},
  noPrinters: {alignItems: 'center', paddingVertical: 16, gap: 8},
  noPrintersText: {color: '#757575', marginTop: 8},
  noPrintersHint: {color: '#BDBDBD', textAlign: 'center'},
});
