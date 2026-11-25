import type { CartLine, Totals } from '@/lib/pricing';

export type OrderStatus = 'esperando_pago' | 'recibido' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
export type PaymentMethod = 'app' | 'barra';

export interface Order {
  id: string;
  number: number;
  lines: CartLine[];
  totals: Totals;
  method: PaymentMethod;
  status: OrderStatus;
  isPaid: boolean;
  rewardId?: string;
  note: string;
  createdAt: number;
}

export interface GuestBeans {
  roaster: string;
  origin: string;
  notes_es: string;
  notes_en: string;
}
