import {create} from 'zustand';
import {v4 as uuidv4} from 'uuid';
import type {DraftLineItem, DraftTopping} from '../domain/models';

interface DraftOrderState {
  lines: DraftLineItem[];
  note: string;
  addLine: (itemName: string, unitPrice: number, quantity?: number) => void;
  updateLine: (
    tempId: string,
    patch: Partial<Pick<DraftLineItem, 'itemName' | 'quantity' | 'unitPrice' | 'toppings'>>,
  ) => void;
  setLineToppings: (tempId: string, toppings: DraftTopping[]) => void;
  removeLine: (tempId: string) => void;
  clear: () => void;
  setNote: (n: string) => void;
}

export const useDraftOrderStore = create<DraftOrderState>((set, get) => ({
  lines: [],
  note: '',
  addLine: (itemName, unitPrice, quantity = 1) =>
    set({
      lines: [
        ...get().lines,
        {tempId: uuidv4(), itemName, quantity, unitPrice, toppings: []},
      ],
    }),
  updateLine: (tempId, patch) =>
    set({
      lines: get().lines.map(l => (l.tempId === tempId ? {...l, ...patch} : l)),
    }),
  setLineToppings: (tempId, toppings) =>
    set({
      lines: get().lines.map(l => (l.tempId === tempId ? {...l, toppings} : l)),
    }),
  removeLine: tempId => set({lines: get().lines.filter(l => l.tempId !== tempId)}),
  clear: () => set({lines: [], note: ''}),
  setNote: note => set({note}),
}));
