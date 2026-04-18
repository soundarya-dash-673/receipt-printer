import React, {useState, useCallback} from 'react';
import {View, FlatList, StyleSheet} from 'react-native';
import {ActivityIndicator} from 'react-native';
import {Text, List, Button, Portal, Dialog, RadioButton, FAB, useTheme} from 'react-native-paper';
import {useFocusEffect} from '@react-navigation/native';
import * as printerRepo from '../data/repositories/printerRepository';
import type {PrinterRecord} from '../domain/models';
import {scanForPrinters, enableBluetooth} from '../utils/bluetoothPrint';
import {Platform} from 'react-native';

export default function PrinterSetupScreen() {
  const theme = useTheme();
  const [saved, setSaved] = useState<PrinterRecord[]>([]);
  const [dialog, setDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<{name: string; address: string}[]>([]);
  const [sel, setSel] = useState('');

  const load = useCallback(async () => {
    setSaved(await printerRepo.getAllPrinters());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openScan = async () => {
    setDialog(true);
    setScanning(true);
    setFound([]);
    try {
      if (Platform.OS === 'android') {
        await enableBluetooth();
      }
      const r = await scanForPrinters();
      setFound(r.printers);
    } finally {
      setScanning(false);
    }
  };

  const addSelected = async () => {
    const p = found.find(x => x.address === sel);
    if (!p) {
      return;
    }
    await printerRepo.savePrinter(p.name || 'Printer', p.address);
    setDialog(false);
    setSel('');
    load();
  };

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <Text style={styles.hint} variant="bodyMedium">
        Save printers you use often. SlipGo can still scan ad-hoc from the receipt screen.
      </Text>
      <FlatList
        data={saved}
        keyExtractor={p => p.id}
        renderItem={({item}) => (
          <List.Item
            title={item.name}
            description={item.bluetoothAddress}
            right={() => (
              <Button onPress={() => printerRepo.deletePrinter(item.id).then(load)} textColor="#c62828">
                Remove
              </Button>
            )}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No saved printers</Text>}
      />
      <FAB icon="plus" style={[styles.fab, {backgroundColor: theme.colors.primary}]} color="#fff" onPress={openScan} />

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Add from scan</Dialog.Title>
          <Dialog.Content>
            {scanning ? (
              <ActivityIndicator />
            ) : (
              <RadioButton.Group value={sel} onValueChange={setSel}>
                {found.map(p => (
                  <RadioButton.Item key={p.address} label={`${p.name}\n${p.address}`} value={p.address} />
                ))}
              </RadioButton.Group>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={addSelected} disabled={!sel}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, paddingTop: 8},
  hint: {paddingHorizontal: 16, marginBottom: 8, opacity: 0.75},
  empty: {textAlign: 'center', marginTop: 32, opacity: 0.5},
  fab: {position: 'absolute', right: 16, bottom: 16},
});
