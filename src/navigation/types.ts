export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  HomeOrders: undefined;
  ReceiptDetail: {orderId: string};
};

export type OrderStackParamList = {
  NewOrder: undefined;
  OrderSummary: undefined;
  ReceiptDetail: {orderId: string};
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  BrandingSetup: undefined;
  PrinterSetup: undefined;
  StaffManagement: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrderTab: undefined;
  ReportsTab: undefined;
  SettingsTab: undefined;
};
