/** Minimal stubs for @brooons/react-native-bluetooth-escpos-printer (web bundle). */

export const BluetoothManager = {
  enableBluetooth: async () => {},
  scanDevices: async () => ({found: [] as unknown[], paired: [] as unknown[]}),
  connect: async (_address: string) => {},
  disconnect: async () => {},
};

const ALIGN = {CENTER: 0, LEFT: 1, RIGHT: 2};

export const BluetoothEscposPrinter = {
  ALIGN,
  printerAlign: async (_align: number) => {},
  printText: async (_text: string, _opts?: object) => {},
};
