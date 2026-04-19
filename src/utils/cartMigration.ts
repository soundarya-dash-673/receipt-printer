import type {CartItem, MenuItem, MenuTopping, SelectedTopping} from '../context/AppContext';

/** Normalizes persisted cart/order line JSON (legacy shapes, string prices). */
export function migrateCartItem(raw: any, index: number): CartItem {
  const menuItem: MenuItem = {
    ...raw.menuItem,
    toppings: (raw.menuItem?.toppings ?? []).map((t: MenuTopping) => {
      const required = !!t.required;
      return {
        ...t,
        price: Number(t.price) || 0,
        required,
        includedByDefault: !!t.includedByDefault || required,
      };
    }),
  };
  const selectedToppings: SelectedTopping[] = (raw.selectedToppings ?? []).map(
    (t: SelectedTopping) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price) || 0,
    }),
  );
  return {
    cartLineId: raw.cartLineId ?? `legacy-${menuItem.id}-${index}`,
    menuItem,
    quantity: raw.quantity ?? 1,
    selectedToppings,
  };
}
