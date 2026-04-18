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
  price: number;
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

/** Draft line before order is persisted */
export interface DraftLineItem {
  tempId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'cash' | 'card' | 'other';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  other: 'Other',
};
