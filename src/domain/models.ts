export type UserRole = 'owner' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pinHash: string;
  createdAt: string;
}

export interface OrderEntity {
  id: string;
  orderNumber: number;
  totalAmount: number;
  taxAmount: number;
  paymentMethod: string;
  createdAt: string;
  createdByUserId: string | null;
  note?: string | null;
}

export interface OrderItemEntity {
  id: string;
  orderId: string;
  itemName: string;
  quantity: number;
  /** Base unit price (before toppings) */
  price: number;
}

/** Snapshot of a topping on a saved order line */
export interface OrderItemToppingEntity {
  id: string;
  orderItemId: string;
  toppingName: string;
  /** 0 = free */
  price: number;
}

export interface ToppingCatalogItem {
  id: string;
  name: string;
  /** 0 = free topping */
  price: number;
  sortOrder: number;
  createdAt: string;
}

export interface Settings {
  id: 1;
  shopName: string;
  logoPath: string | null;
  taxPercentage: number;
  receiptFooter: string;
}

export interface PrinterRecord {
  id: string;
  name: string;
  bluetoothAddress: string;
}

/** Selected topping on a draft line (prices copied from catalog at selection time) */
export interface DraftTopping {
  catalogId: string;
  name: string;
  /** 0 = free */
  price: number;
}

/** Draft line before order is persisted */
export interface DraftLineItem {
  tempId: string;
  itemName: string;
  quantity: number;
  /** Base unit price only; toppings billed per unit */
  unitPrice: number;
  toppings: DraftTopping[];
}

export type PaymentMethod = 'cash' | 'card' | 'other';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
};
