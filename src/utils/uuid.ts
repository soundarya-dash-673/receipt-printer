/**
 * RFC 4122 v4 UUID via crypto.getRandomValues.
 * react-native-get-random-values attaches to `global.crypto`; we also read `globalThis.crypto`
 * after index.js syncs them when needed.
 */
export function uuidv4(): string {
  const cryptoObj =
    (typeof globalThis !== 'undefined' && globalThis.crypto) ||
    (typeof global !== 'undefined' && global.crypto);
  if (!cryptoObj?.getRandomValues) {
    throw new Error(
      'crypto.getRandomValues is not available. Ensure index.js imports react-native-get-random-values first.',
    );
  }
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
