/**
 * Bluetooth ESC/POS thermal printer utility.
 *
 * Import the local shim — NOT the package entry — upstream index.js assigns
 * BluetoothTscPrinter.DIRECTION at load time and crashes when the native
 * module is null (simulator / missing native build). Metro alias is a fallback.
 *
 * Supported printers: Any ESC/POS compatible Bluetooth thermal printer
 * (Epson, Star Micronics, HOIN, Rongta, etc.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '../shims/bluetooth-escpos-printer';
import {Platform, PermissionsAndroid} from 'react-native';
import {Order} from '../context/AppContext';
import {buildESCPOSData} from './receiptTemplate';

const SAVED_BT_PRINTER_KEY = '@slipgo_bt_printer_mac';

export interface BTPrinter {
  name: string;
  address: string;
}

export interface BTResult {
  success: boolean;
  error?: string;
}

/**
 * Native `BluetoothManager.scanDevices()` resolves a JSON *string* (see
 * RNBluetoothManagerModule: promise.resolve(result.toString())). Reading
 * `.paired` / `.found` on that string yields undefined — lists look empty
 * even when the printer is bonded (e.g. Rongta RPP300 paired via RTPrinter).
 */
function normalizeBluetoothScanPayload(raw: unknown): {
  paired: Array<{name?: string | null; address?: string}>;
  found: Array<{name?: string | null; address?: string}>;
} {
  let obj: {paired?: unknown; found?: unknown} | null = null;
  if (raw == null) {
    return {paired: [], found: []};
  }
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as {paired?: unknown; found?: unknown};
    } catch {
      return {paired: [], found: []};
    }
  } else if (typeof raw === 'object') {
    obj = raw as {paired?: unknown; found?: unknown};
  } else {
    return {paired: [], found: []};
  }
  const asList = (v: unknown) => (Array.isArray(v) ? v : []);
  return {paired: asList(obj?.paired), found: asList(obj?.found)};
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'ios') {return true;}

  try {
    if (Platform.Version >= 31) {
      // Android 12+
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted'
      );
    } else {
      // Android 11 and below
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return result === 'granted';
    }
  } catch {
    return false;
  }
}

// ─── Enable Bluetooth ─────────────────────────────────────────────────────────

function bluetoothUnavailableMessage(): string {
  return 'Bluetooth printing is not available on this device (use PDF/Share, or Android + hardware).';
}

export async function enableBluetooth(): Promise<BTResult> {
  if (!BluetoothManager?.enableBluetooth) {
    return {success: false, error: bluetoothUnavailableMessage()};
  }
  // Android 12+: native enableBluetooth() calls getBondedDevices() — needs
  // BLUETOOTH_CONNECT before any Bluetooth API (must run before scanDevices too).
  if (Platform.OS === 'android') {
    const ok = await requestBluetoothPermissions();
    if (!ok) {
      return {success: false, error: 'Bluetooth permission denied'};
    }
  }
  try {
    await BluetoothManager.enableBluetooth();
    return {success: true};
  } catch (e: any) {
    return {success: false, error: e?.message ?? 'Could not enable Bluetooth'};
  }
}

// ─── Scan for devices ─────────────────────────────────────────────────────────

export async function scanForPrinters(): Promise<{printers: BTPrinter[]; error?: string}> {
  if (!BluetoothManager?.scanDevices) {
    return {printers: [], error: bluetoothUnavailableMessage()};
  }
  try {
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      return {printers: [], error: 'Bluetooth permission denied'};
    }

    const rawResult: unknown = await BluetoothManager.scanDevices();
    const {paired, found} = normalizeBluetoothScanPayload(rawResult);
    const all = [...paired, ...found];

    const unique = Array.from(
      new Map(
        all
          .filter((d: {address?: string}) => !!d?.address)
          .map((d: {name?: string | null; address?: string}) => [d.address, d]),
      ).values(),
    ).map((d: {name?: string | null; address?: string}) => ({
      name: d.name && String(d.name).trim() ? String(d.name) : 'Unknown',
      address: String(d.address).toUpperCase(),
    }));

    return {printers: unique};
  } catch (e: any) {
    return {printers: [], error: e?.message ?? 'Scan failed'};
  }
}

// ─── Connect to printer ───────────────────────────────────────────────────────

export async function connectToPrinter(address: string): Promise<BTResult> {
  if (!BluetoothManager?.connect) {
    return {success: false, error: bluetoothUnavailableMessage()};
  }
  if (Platform.OS === 'android') {
    const ok = await requestBluetoothPermissions();
    if (!ok) {
      return {success: false, error: 'Bluetooth permission denied'};
    }
  }
  try {
    await BluetoothManager.connect(address);
    return {success: true};
  } catch (e: any) {
    return {success: false, error: e?.message ?? 'Connection failed'};
  }
}

// ─── Saved printer (reconnect on next app start) ─────────────────────────────

export async function getSavedBluetoothPrinterAddress(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(SAVED_BT_PRINTER_KEY);
    return v?.trim() ? v.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function setSavedBluetoothPrinterAddress(address: string | null): Promise<void> {
  try {
    if (address?.trim()) {
      await AsyncStorage.setItem(SAVED_BT_PRINTER_KEY, address.trim().toUpperCase());
    } else {
      await AsyncStorage.removeItem(SAVED_BT_PRINTER_KEY);
    }
  } catch {
    // ignore
  }
}

/** Best-effort: address the native SPP layer reports as connected (if any). */
export async function getNativeConnectedPrinterAddress(): Promise<string | null> {
  if (Platform.OS !== 'android' || !BluetoothManager?.getConnectedDeviceAddress) {
    return null;
  }
  try {
    const addr = await BluetoothManager.getConnectedDeviceAddress();
    if (addr == null || addr === '') {
      return null;
    }
    return String(addr).toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Call once on app launch (Android). Reconnects to the last successful printer
 * so receipts can print without opening the picker each time.
 */
export async function connectSavedPrinterOnStartup(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const saved = await getSavedBluetoothPrinterAddress();
  if (!saved) {
    return;
  }
  const perm = await requestBluetoothPermissions();
  if (!perm) {
    return;
  }
  const enabled = await enableBluetooth();
  if (!enabled.success) {
    return;
  }
  try {
    if (BluetoothManager?.isDeviceConnected) {
      const already = await BluetoothManager.isDeviceConnected();
      const current = await getNativeConnectedPrinterAddress();
      if (already && current && current === saved) {
        return;
      }
    }
  } catch {
    // continue to connect
  }
  await connectToPrinter(saved).catch(() => {});
}

/**
 * True when a saved printer MAC is set and the native SPP connection matches it.
 * Use on the receipt screen to decide if BT print is allowed (connection is managed in Settings).
 */
export async function isBluetoothReadyToPrint(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const saved = await getSavedBluetoothPrinterAddress();
  if (!saved || !BluetoothManager?.isDeviceConnected) {
    return false;
  }
  try {
    const connected = await BluetoothManager.isDeviceConnected();
    if (!connected) {
      return false;
    }
    const addr = await getNativeConnectedPrinterAddress();
    return addr !== null && addr === saved;
  } catch {
    return false;
  }
}

// ─── Disconnect ───────────────────────────────────────────────────────────────

/**
 * Native `disconnect(String address, Promise)` — must pass the device MAC.
 * If omitted, we resolve the current connection address when possible.
 */
export async function disconnectPrinter(explicitAddress?: string | null): Promise<void> {
  if (!BluetoothManager?.disconnect) {
    return;
  }
  try {
    let addr = explicitAddress?.trim() || null;
    if (!addr && BluetoothManager.getConnectedDeviceAddress) {
      const fromNative = await BluetoothManager.getConnectedDeviceAddress();
      if (fromNative) {
        addr = String(fromNative);
      }
    }
    if (!addr) {
      return;
    }
    await BluetoothManager.disconnect(addr);
  } catch {
    // ignore
  }
}

// ─── Print Receipt ────────────────────────────────────────────────────────────

export async function printReceiptViaBluetooth(
  order: Order,
  copyLabel: 'KITCHEN COPY' | 'CUSTOMER COPY',
): Promise<BTResult> {
  if (!BluetoothEscposPrinter?.ALIGN || !BluetoothEscposPrinter.printText) {
    return {success: false, error: bluetoothUnavailableMessage()};
  }
  if (Platform.OS === 'android') {
    const ok = await requestBluetoothPermissions();
    if (!ok) {
      return {success: false, error: 'Bluetooth permission denied'};
    }
  }

  const isKitchen = copyLabel === 'KITCHEN COPY';

  try {
    const data = buildESCPOSData(order);
    const lineWidth = 32;

    // ── Header ──
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`${data.header}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heighttimes: 1,
    });
    await BluetoothEscposPrinter.printText('================================\n', {});
    await BluetoothEscposPrinter.printText(`${copyLabel}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heighttimes: 1,
    });
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    await BluetoothEscposPrinter.printText(`Order #${data.orderId}\n`, {});
    await BluetoothEscposPrinter.printText(`${data.dateStr}\n`, {});

    // Payment info only for customer copy
    if (!isKitchen && data.paymentLabel) {
      await BluetoothEscposPrinter.printText(`Payment: ${data.paymentLabel}\n`, {});
    }
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    // ── Items ──
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    for (const item of data.items) {
      if (isKitchen) {
        // Kitchen: item name + qty only, no prices
        await BluetoothEscposPrinter.printText(
          `${truncate(item.name, lineWidth)}\n`, {},
        );
        await BluetoothEscposPrinter.printText(`  Qty: ${item.qty}\n`, {});
        if (item.toppingLines?.length) {
          for (const tl of item.toppingLines) {
            await BluetoothEscposPrinter.printText(`  + ${truncate(tl.name, lineWidth - 4)}\n`, {});
          }
        }
      } else {
        // Customer: full item line with price
        await BluetoothEscposPrinter.printText(
          `${truncate(item.name, lineWidth)}\n`, {},
        );
        const qtyUnit = `${item.qty} x ${item.unitPrice}`;
        await BluetoothEscposPrinter.printText(
          `${formatLine(qtyUnit, item.price, lineWidth)}\n`, {},
        );
        if (item.toppingLines?.length) {
          for (const tl of item.toppingLines) {
            const left = `  + ${tl.name}`;
            await BluetoothEscposPrinter.printText(
              `${formatLine(left, tl.priceLabel, lineWidth)}\n`, {},
            );
          }
        }
      }
    }

    await BluetoothEscposPrinter.printText('--------------------------------\n', {});

    if (isKitchen) {
      // Kitchen: no totals, just a footer
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('** KITCHEN COPY **\n', {
        fonttype: 1,
        widthtimes: 1,
        heighttimes: 1,
      });
    } else {
      // Customer: full totals
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(
        `${formatLine('Subtotal', data.subtotal, lineWidth)}\n`, {},
      );
      await BluetoothEscposPrinter.printText(
        `${formatLine('Tax', data.tax, lineWidth)}\n`, {},
      );
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
      await BluetoothEscposPrinter.printText(
        `${formatLine('TOTAL', data.total, lineWidth)}\n`,
        {fonttype: 1, widthtimes: 1, heighttimes: 1},
      );
    }

    await BluetoothEscposPrinter.printText('================================\n', {});

    // ── Note ──
    if (data.note) {
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText(`Note: ${data.note}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }

    // ── Footer ──
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText(`${data.footer}\n`, {});
    await BluetoothEscposPrinter.printText('\n\n\n', {}); // Feed paper

    return {success: true};
  } catch (e: any) {
    console.error('Bluetooth print error', e);
    return {success: false, error: e?.message ?? 'Print failed'};
  }
}

function formatLine(left: string, right: string, width: number): string {
  const safeRight = right ?? "";
  const leftMax = Math.max(1, width - safeRight.length - 1);
  const safeLeft = truncate(left ?? "", leftMax);
  const spaces = Math.max(1, width - safeLeft.length - safeRight.length);
  return `${safeLeft}${' '.repeat(spaces)}${safeRight}`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, Math.max(0, max - 3)) + '...' : str;
}
