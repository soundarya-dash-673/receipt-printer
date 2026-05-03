import React, {useState, useCallback} from 'react';
import {View, ScrollView, StyleSheet, Platform, ActivityIndicator, Alert} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  Divider,
  Portal,
  Dialog,
  RadioButton,
  Surface,
} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  scanForPrinters,
  connectToPrinter,
  disconnectPrinter,
  enableBluetooth,
  setSavedBluetoothPrinterAddress,
  getSavedBluetoothPrinterAddress,
  getNativeConnectedPrinterAddress,
  type BTPrinter,
} from '../utils/bluetoothPrint';

/**
 * Android-only: pair/select thermal printer. Receipt printing requires connection here first.
 */
export default function BluetoothPrinterSettingsSection() {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [printers, setPrinters] = useState<BTPrinter[]>([]);
  const [selected, setSelected] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [savedMac, setSavedMac] = useState<string | null>(null);
  const [connectedMac, setConnectedMac] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }
    const [s, c] = await Promise.all([
      getSavedBluetoothPrinterAddress(),
      getNativeConnectedPrinterAddress(),
    ]);
    setSavedMac(s);
    setConnectedMac(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );

  if (Platform.OS !== 'android') {
    return (
      <Surface style={styles.card} elevation={1}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <MaterialCommunityIcons name="bluetooth" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={styles.title}>
              Bluetooth printer
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>
            Bluetooth thermal printing is only supported on Android with this build.
          </Text>
        </View>
      </Surface>
    );
  }

  const doScan = async () => {
    setScanning(true);
    setPrinters([]);
    try {
      await enableBluetooth();
      const {printers: found, error} = await scanForPrinters();
      if (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
      }
      setPrinters(found);
      const s = await getSavedBluetoothPrinterAddress();
      if (s && found.some(p => p.address === s)) {
        setSelected(s);
      }
    } finally {
      setScanning(false);
    }
  };

  const openDialog = async () => {
    setDialogOpen(true);
    setSelected('');
    await doScan();
  };

  const handleConnect = async () => {
    if (!selected) {
      return;
    }
    setConnecting(true);
    try {
      const result = await connectToPrinter(selected);
      if (result.success) {
        await setSavedBluetoothPrinterAddress(selected);
        await refreshStatus();
        setDialogOpen(false);
      } else {
        Alert.alert('Bluetooth', result.error ?? 'Could not connect');
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleForget = async () => {
    await setSavedBluetoothPrinterAddress(null);
    await disconnectPrinter();
    await refreshStatus();
  };

  const connectedToSaved =
    savedMac && connectedMac && savedMac === connectedMac;

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="bluetooth" size={20} color={theme.colors.primary} />
          <Text variant="titleSmall" style={styles.title}>
            Bluetooth printer
          </Text>
        </View>
        <Divider style={styles.divider} />
        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 10}}>
          Connect your thermal printer here once. Printing from a receipt only works when this shows
          connected. Match MAC addresses with RTPrinter if names appear as “Unknown”.
        </Text>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons
            name={connectedToSaved ? 'bluetooth-connect' : 'bluetooth-off'}
            size={22}
            color={connectedToSaved ? '#2E7D32' : '#9E9E9E'}
          />
          <Text variant="bodyMedium" style={{marginLeft: 8, flex: 1}}>
            {connectedToSaved
              ? `Ready — ${savedMac}`
              : savedMac
                ? `Saved ${savedMac} — ${connectedMac ? 'not linked (tap Choose printer)' : 'not connected'}`
                : 'No printer saved'}
          </Text>
        </View>
        <View style={styles.row}>
          <Button mode="contained" icon="bluetooth-audio" onPress={openDialog} style={{flex: 1}}>
            Choose printer
          </Button>
        </View>
        {savedMac ? (
          <Button mode="outlined" icon="link-off" onPress={handleForget} textColor="#C62828" style={{marginTop: 8}}>
            Forget printer
          </Button>
        ) : null}
      </View>

      <Portal>
        <Dialog visible={dialogOpen} onDismiss={() => setDialogOpen(false)}>
          <Dialog.Title>Select Bluetooth printer</Dialog.Title>
          <Dialog.Content>
            {scanning ? (
              <View style={styles.scanRow}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.scanText}>Scanning…</Text>
              </View>
            ) : printers.length === 0 ? (
              <Text variant="bodyMedium" style={{color: '#757575'}}>
                No devices found. Pair the printer in Android Bluetooth settings, then tap Rescan.
              </Text>
            ) : (
              <ScrollView style={{maxHeight: 320}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                <Text variant="bodySmall" style={{marginBottom: 10, color: theme.colors.onSurfaceVariant}}>
                  Pick the row whose MAC matches your printer (e.g. RPP300 in RTPrinter).
                </Text>
                <RadioButton.Group value={selected} onValueChange={setSelected}>
                  {printers.map((p, i) => (
                    <RadioButton.Item
                      key={`${p.address}-${i}`}
                      label={`${p.name}\n${p.address}`}
                      value={p.address}
                      labelStyle={{fontSize: 13}}
                    />
                  ))}
                </RadioButton.Group>
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogOpen(false)}>Cancel</Button>
            <Button onPress={doScan} disabled={scanning}>
              Rescan
            </Button>
            <Button mode="contained" onPress={handleConnect} disabled={!selected || connecting} loading={connecting}>
              Connect
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {borderRadius: 12},
  inner: {borderRadius: 12, overflow: 'hidden', padding: 16},
  header: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8},
  title: {fontWeight: '700', color: '#424242'},
  divider: {marginBottom: 14},
  statusRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  row: {flexDirection: 'row', gap: 8},
  scanRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8},
  scanText: {color: '#555'},
});
