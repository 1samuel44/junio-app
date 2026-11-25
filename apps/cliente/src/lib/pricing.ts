// Cálculo del carrito. Sigue las mismas reglas que create_order en supabase/migrations/*_esquema_inicial.sql:
// el servidor vuelve a calcular todo; esto es solo para mostrar el total en la app.
import { itemById, type Menu, type MenuItem } from '@/data/menu';

export interface CartLine {
  key: string;
  itemId: number;
  optionIds: number[];
  qty: number;
}

export function unitPrice(menu: Menu, item: MenuItem, optionIds: number[]): number {
  return menu.options
    .filter((o) => o.item_id === item.id && optionIds.includes(o.id))
    .reduce((sum, o) => sum + Number(o.price_delta), Number(item.base_price));
}

/** Línea donde se aplica la bebida gratis: la primera bebida de café (igual que el servidor). */
export function rewardLineIndex(menu: Menu, lines: CartLine[]): number {
  return lines.findIndex((l) => itemById(menu, l.itemId)?.is_coffee);
}

export interface Totals {
  subtotal: number;
  discount: number;
  total: number;
  rewardLine: number; // -1 si no se aplica
}

export function cartTotals(menu: Menu, lines: CartLine[], useReward: boolean): Totals {
  let subtotal = 0;
  for (const l of lines) {
    const item = itemById(menu, l.itemId);
    if (item) subtotal += unitPrice(menu, item, l.optionIds) * l.qty;
  }
  const rewardLine = useReward ? rewardLineIndex(menu, lines) : -1;
  // una unidad gratis, con su tamaño y extras
  const discount =
    rewardLine >= 0 ? unitPrice(menu, itemById(menu, lines[rewardLine].itemId)!, lines[rewardLine].optionIds) : 0;
  return { subtotal, discount, total: subtotal - discount, rewardLine };
}

export function defaultOptionIds(menu: Menu, itemId: number): number[] {
  return menu.options.filter((o) => o.item_id === itemId && o.is_default).map((o) => o.id);
}

/** Quita del carrito lo que ya no existe o se agotó (el menú puede cambiar desde el panel). */
export function availableLines(menu: Menu, lines: CartLine[]): CartLine[] {
  return lines.filter((l) => itemById(menu, l.itemId)?.is_available);
}

export const money = (n: number) => `$${Number(n).toFixed(0)}`;
