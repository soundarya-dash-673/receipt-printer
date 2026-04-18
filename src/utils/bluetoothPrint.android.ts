/**
 * Bluetooth ESC/POS thermal printer (Android only).
 * @brooons/react-native-bluetooth-escpos-printer is Android-only; its index.js crashes on iOS
 * if imported (sets properties on null native modules). Use bluetoothPrint.ios.ts there.
 */
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '@brooons/react-native-bluetooth-escpos-printer';
import {Platform, PermissionsAndroid} from 'react-native';
import {Order} from '../context/AppContext';
import {buildESCPOSData} from './receiptTemplate';

export interface BTPrinter {
  name: string;
  address: string;
}

export interface BTResult {
  success: boolean;
  error?: string;
}

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return true;
  }

  try {
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
      );
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return result === 'granted';
  } catch {
    return false;
  }
}

export async function enableBluetooth(): Promise<BTResult> {
  try {
    await BluetoothManager.enableBluetooth();
    return {success: true};
  } catch (e: any) {
    return {success: false, error: e?.message ?? 'Could not enable Bluetooth'};
  }
}

export async function scanForPrinters(): Promise<{printers: BTPrinter[]; error?: string}> {
  try {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return {printers: [], error: 'Bluetooth permission denied'};
    }

    const rawResult: any = await BluetoothManager.scanDevices();
    const found = rawResult?.found ?? [];
    const paired = rawResult?.paired ?? [];
    const all = [...paired, ...found];

    const unique = Array.from(
      new Map(all.map((d: any) => [d.address, d])).values(),
    ).map((d: any) => ({name: d.name ?? 'Unknown', address: d.address}));

    return {printers: unique};
  } catch (e: any) {
    return {printers: [], error: e?.message ?? 'Scan failed'};
  }
}

export async function connectToPrinter(address: string): Promise<BTResult> {
  try {
    await BluetoothManager.connect(address);
    return {success: true};
  } catch (e: any) {
    return {success: false, error: e?.message ?? 'Connection failed'};
  }
}

export async function disconnectPrinter(): Promise<void> {
  try {
    await BluetoothManager.disconnect();
  } catch {
    /* ignore */
  }
}

export async function printReceiptViaBluetooth(order: Order): Promise<BTResult> {
  try {
    const data = buildESCPOSData(order);

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`${data.header}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heighttimes: 1,
    });
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`Order #${data.orderId}\n`, {});
    await BluetoothEscposPrinter.printText(`${data.dateStr}\n`, {});
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT,
    );
    for (const item of data.items) {
      const nameLine = truncate(item.name, 20);
      const qtyPrice = `${item.qty}x ${item.unitPrice}`.padStart(12);
      const lineTotal = item.price.padStart(8);
      await BluetoothEscposPrinter.printText(
        `${nameLine.padEnd(20)}${qtyPrice}${lineTotal}\n`,
        {},
      );
    }

    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.RIGHT,
    );
    await BluetoothEscposPrinter.printText(`Subtotal: ${data.subtotal}\n`, {});
    await BluetoothEscposPrinter.printText(`Tax: ${data.tax}\n`, {});
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`TOTAL: ${data.total}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heighttimes: 1,
    });
    await BluetoothEscposPrinter.printText('================================\n', {});

    if (data.note) {
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT,
      );
      await BluetoothEscposPrinter.printText(`Note: ${data.note}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }

    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER,
    );
    await BluetoothEscposPrinter.printText(`${data.footer}\n`, {});
    await BluetoothEscposPrinter.printText('\n\n\n', {});

    return {success: true};
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Print failed';
    return {success: false, error: message};
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
