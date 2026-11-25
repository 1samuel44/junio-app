// Cálculo del carrito. Sigue las mismas reglas que create_order en supabase/esquema.sql:
// el servidor vuelve a calcular todo; esto es solo para mostrar el total en la app.
import { itemById, options, type MenuItem } from '@/data/menu';

export interface CartLine {
  key: string;
  itemId: number;
  optionIds: number[];
  qty: number;
}

export function unitPrice(item: MenuItem, optionIds: number[]): number {
  return options
    .filter((o) => o.item_id === item.id && optionIds.includes(o.id))
    .reduce((sum, o) => sum + o.price_delta, item.base_price);
}

/** Línea donde se aplica la bebida gratis: la primera bebida de café (igual que el servidor). */
export function rewardLineIndex(lines: CartLine[]): number {
  return lines.findIndex((l) => itemById(l.itemId)?.is_coffee);
}

export interface Totals {
  subtotal: number;
  discount: number;
  total: number;
  rewardLine: number; // -1 si no se aplica
}

export function cartTotals(lines: CartLine[], useReward: boolean): Totals {
  let subtotal = 0;
  for (const l of lines) {
    const item = itemById(l.itemId);
    if (item) subtotal += unitPrice(item, l.optionIds) * l.qty;
  }
  const rewardLine = useReward ? rewardLineIndex(lines) : -1;
  // una unidad gratis, con su tamaño y extras
  const discount =
    rewardLine >= 0 ? unitPrice(itemById(lines[rewardLine].itemId)!, lines[rewardLine].optionIds) : 0;
  return { subtotal, discount, total: subtotal - discount, rewardLine };
}

export function defaultOptionIds(itemId: number): number[] {
  return options.filter((o) => o.item_id === itemId && o.is_default).map((o) => o.id);
}

export const money = (n: number) => `$${n.toFixed(0)}`;
