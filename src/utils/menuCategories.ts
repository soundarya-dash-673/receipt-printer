/**
 * Preferred order for menu / order filters (matches common restaurant groupings).
 * Unknown categories sort alphabetically after these.
 */
export const MENU_CATEGORY_ORDER = [
  'Starters',
  'Mains',
  'Sides',
  'Toppings',
  'Desserts',
  'Drinks',
  'Specials',
];

export function sortMenuCategories(categories: Iterable<string>): string[] {
  const arr = Array.from(new Set(categories));
  const known = MENU_CATEGORY_ORDER.filter(c => arr.includes(c));
  const rest = arr
    .filter(c => !MENU_CATEGORY_ORDER.includes(c))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...rest];
}
