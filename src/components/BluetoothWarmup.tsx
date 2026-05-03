import {useEffect} from 'react';
import {connectSavedPrinterOnStartup} from '../utils/bluetoothPrint';

/**
 * Android: reconnect to the last Bluetooth printer once when the app starts.
 */
export default function BluetoothWarmup() {
  useEffect(() => {
    connectSavedPrinterOnStartup();
  }, []);
  return null;
}
