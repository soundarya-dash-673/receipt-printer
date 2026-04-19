import * as CryptoJS from 'crypto-js';

const PIN_SALT = 'slipgo-pin-v1';

export function hashPin(pin: string): string {
  return CryptoJS.SHA256(`${PIN_SALT}:${pin}`).toString();
}
