import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Polyfill sets `global.crypto`; some Hermes builds don't mirror it on `globalThis` (used by src/utils/uuid.ts).
if (
  typeof globalThis !== 'undefined' &&
  typeof global !== 'undefined' &&
  global.crypto &&
  !globalThis.crypto
) {
  globalThis.crypto = global.crypto;
}

AppRegistry.registerComponent(appName, () => App);
