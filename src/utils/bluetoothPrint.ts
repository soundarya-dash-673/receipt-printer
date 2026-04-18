/**
 * Bluetooth ESC/POS thermal printer utility.
 * Uses @brooons/react-native-bluetooth-escpos-printer.
 */
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '@brooons/react-native-bluetooth-escpos-printer';
import {Platform, PermissionsAndroid} from 'react-native';
import type {ReceiptPayload} from './receiptTemplate';
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {success: false, error: msg || 'Could not enable Bluetooth'};
  }
}

export async function scanForPrinters(): Promise<{printers: BTPrinter[]; error?: string}> {
  try {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return {printers: [], error: 'Bluetooth permission denied'};
    }

    const rawResult: {found?: unknown[]; paired?: unknown[]} = await BluetoothManager.scanDevices();
    const found = rawResult?.found ?? [];
    const paired = rawResult?.paired ?? [];
    const all = [...paired, ...found];

    const unique = Array.from(
      new Map(
        all.map((d: {address?: string; name?: string}) => [
          d.address,
          {name: d.name ?? 'Unknown', address: d.address ?? ''},
        ]),
      ).values(),
    ).filter((d: BTPrinter) => d.address);

    return {printers: unique};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {printers: [], error: msg || 'Scan failed'};
  }
}

export async function connectToPrinter(address: string): Promise<BTResult> {
  try {
    await BluetoothManager.connect(address);
    return {success: true};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return {success: false, error: msg || 'Connection failed'};
  }
}

export async function disconnectPrinter(): Promise<void> {
  try {
    await BluetoothManager.disconnect();
  } catch {
    /* ignore */
  }
}

export async function printReceiptViaBluetooth(payload: ReceiptPayload): Promise<BTResult> {
  try {
    const data = buildESCPOSData(payload);

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`${data.header}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heighttimes: 1,
    });
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`Order ${data.orderId}\n`, {});
    await BluetoothEscposPrinter.printText(`${data.dateStr}\n`, {});
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    for (const line of data.lines) {
      const nameLine = truncate(line.title, 18);
      await BluetoothEscposPrinter.printText(`${nameLine} x${line.qty}\n`, {});
      await BluetoothEscposPrinter.printText(`${truncate(line.baseLine, 42)}\n`, {});
      for (const t of line.toppingLines) {
        await BluetoothEscposPrinter.printText(`${truncate(t.text, 42)}\n`, {});
      }
      await BluetoothEscposPrinter.printText(`Line: ${line.lineTotal}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }

    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
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
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Note: ${data.note}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${data.footer}\n`, {});
    await BluetoothEscposPrinter.printText('\n\n\n', {});

    return {success: true};
  } catch (e: unknown) {
    console.error('Bluetooth print error', e);
    const msg = e instanceof Error ? e.message : String(e);
    return {success: false, error: msg || 'Print failed'};
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}
