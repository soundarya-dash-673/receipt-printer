# Food Receipt App — Setup Guide

A React Native app for managing food menus, building orders, calculating tax, and printing receipts via Bluetooth thermal printers or PDF/share.

---

## Features

- **Menu Management** — Add, edit, and delete food items with name, price, and category
- **Order Builder / Cart** — Select items, adjust quantities, add notes
- **Tax Calculation** — Configurable tax rate applied automatically
- **Order History** — Full history of all past orders with search
- **PDF Receipt** — Export and share receipts as PDF via email, WhatsApp, etc.
- **Bluetooth Printing** — Print directly to any ESC/POS Bluetooth thermal printer

---

## Requirements

- Node.js >= 18
- React Native CLI (not Expo)
- Xcode 14+ (for iOS)
- Android Studio (for Android)
- JDK 17

---

## Installation

### 1. Install dependencies

```bash
cd receipt-printer
npm install
```

### 2. iOS — Install Pods

```bash
cd ios && pod install && cd ..
```

### 3. Add vector icons font (iOS)

In `ios/FoodReceiptApp/Info.plist`, add:
```xml
<key>UIAppFonts</key>
<array>
  <string>MaterialCommunityIcons.ttf</string>
</array>
```

For Android, in `android/app/build.gradle`, add:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### 4. react-native-webview (Receipt Preview)

```bash
npm install react-native-webview
cd ios && pod install && cd ..
```

---

## Running the App

### Android
```bash
npx react-native run-android
```

### iOS
```bash
npx react-native run-ios
```

---

## Bluetooth Printer Setup

The app supports any **ESC/POS compatible Bluetooth thermal printer**, including:
- Epson TM series
- Star Micronics SP/TSP series
- HOIN HOP-E series
- Rongta RP series
- Xprinter series

### Steps:
1. Power on your thermal printer
2. Put it in **pairing mode** (usually hold the feed button on power-up)
3. Pair it with your phone via **Android/iOS Bluetooth settings** first
4. In the app, go to **Order tab → Place Order → BT Print**
5. Tap "Scan" to discover nearby printers
6. Select your printer and tap **Connect**
7. Tap **Print** to print the receipt

### Android Permissions (auto-handled)
The app automatically requests:
- `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` (Android 12+)
- `ACCESS_FINE_LOCATION` (Android 11 and below)

### iOS
Add to Info.plist (already done):
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

---

## PDF / Share Receipt

Tap **PDF / Share** on the Receipt screen to:
- Save as PDF to Files app
- Share via WhatsApp, Email, Messages, etc.
- Print via AirPrint (iOS) or Google Cloud Print (Android)

---

## Project Structure

```
receipt-printer/
├── App.tsx                          # Root component
├── index.js                         # Entry point
├── src/
│   ├── context/
│   │   └── AppContext.tsx           # Global state (menu, cart, orders, settings)
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Bottom tab + stack navigation
│   ├── screens/
│   │   ├── MenuScreen.tsx           # Browse/manage menu items
│   │   ├── MenuItemFormScreen.tsx   # Add/edit a menu item
│   │   ├── CartScreen.tsx           # Order builder with tax totals
│   │   ├── OrderHistoryScreen.tsx   # Past orders
│   │   ├── ReceiptScreen.tsx        # Receipt preview + print/PDF actions
│   │   └── SettingsScreen.tsx       # Restaurant info, tax rate, stats
│   └── utils/
│       ├── receiptTemplate.ts       # HTML receipt builder + ESC/POS data
│       ├── pdfPrint.ts              # PDF export + share
│       └── bluetoothPrint.ts        # BT scanning, connecting, printing
├── android/
│   └── app/src/main/AndroidManifest.xml   # Android Bluetooth permissions
└── ios/
    └── FoodReceiptApp/Info.plist    # iOS Bluetooth permissions
```

---

## Customisation

### Change tax rate
Go to **Settings tab** → Tax Rate → enter your local rate (e.g. `8.5` for 8.5%)

### Change restaurant info
Go to **Settings tab** → fill in Restaurant Name, Address, Phone

### Add menu categories
When adding a menu item, type a custom category or tap a suggested one (Starters, Mains, Sides, Desserts, Drinks, Specials)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Printer not found | Ensure printer is paired in phone's BT settings first |
| "Bluetooth permission denied" | Grant location permission (Android ≤ 11) in phone settings |
| PDF not generating | Ensure `WRITE_EXTERNAL_STORAGE` permission is granted on older Android |
| WebView blank | Install `react-native-webview`: `npm install react-native-webview` |
| Pod install fails | Run `cd ios && pod repo update && pod install` |
