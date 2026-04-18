/**
 * iOS: @brooons/react-native-bluetooth-escpos-printer is Android-only. Its JS entry file
 * assigns to native module objects at import time; on iOS those are null → crash
 * ("Cannot set property 'DIRECTION' of null"). We never import that package on iOS.
 */
import {Order} from '../context/AppContext';

export interface BTPrinter {
  name: string;
  address: string;
}

export interface BTResult {
  success: boolean;
  error?: string;
}

const UNSUPPORTED =
  'Bluetooth thermal printing is not available on iOS in this build. Use PDF export, or run the app on Android with a paired ESC/POS printer.';

export async function requestBluetoothPermissions(): Promise<boolean> {
  return false;
}

export async function enableBluetooth(): Promise<BTResult> {
  return {success: false, error: UNSUPPORTED};
}

export async function scanForPrinters(): Promise<{printers: BTPrinter[]; error?: string}> {
  return {printers: [], error: UNSUPPORTED};
}

export async function connectToPrinter(_address: string): Promise<BTResult> {
  return {success: false, error: UNSUPPORTED};
}

export async function disconnectPrinter(): Promise<void> {
  /* no-op */
}

export async function printReceiptViaBluetooth(_order: Order): Promise<BTResult> {
  return {success: false, error: UNSUPPORTED};
}
