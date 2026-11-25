// Estado de la app de prueba: idioma, carrito, tarjeta y pedidos.
// Se guarda en el teléfono. En la etapa 2 la tarjeta y los pedidos vendrán de Supabase.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import { strings, type Lang, type Strings } from '@/lib/i18n';
import { cartTotals, type CartLine, type Totals } from '@/lib/pricing';
import { awardStamp, emptyCard, openRewards, redeemReward, type AwardResult, type Card } from '@/lib/rewards';

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

interface State {
  lang: Lang;
  cart: CartLine[];
  useReward: boolean;
  card: Card;
  orders: Order[];
  nextNumber: number;
  notice?: AwardResult;
}

const initialState = (): State => ({
  lang: 'es',
  cart: [],
  useReward: false,
  card: awardStamp(emptyCard(), 'bienvenida', Date.now()).card, // sello de bienvenida
  orders: [],
  nextNumber: 101,
});

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'lang'; lang: Lang }
  | { type: 'add'; line: Omit<CartLine, 'key'> }
  | { type: 'qty'; key: string; delta: number }
  | { type: 'useReward'; value: boolean }
  | { type: 'place'; method: PaymentMethod; note: string; now: number }
  | { type: 'advance'; orderId: string; now: number }
  | { type: 'scan'; now: number }
  | { type: 'dismissNotice' }
  | { type: 'reset' };

const sameLine = (a: Omit<CartLine, 'key'>, b: CartLine) =>
  a.itemId === b.itemId && [...a.optionIds].sort().join() === [...b.optionIds].sort().join();

function giveStamp(state: State, now: number, source: 'pedido' | 'escaneo'): State {
  const { card, result } = awardStamp(state.card, source, now);
  return { ...state, card, notice: result };
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  esperando_pago: 'recibido',
  recibido: 'preparando',
  preparando: 'listo',
  listo: 'entregado',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'lang':
      return { ...state, lang: action.lang };
    case 'add': {
      const existing = state.cart.find((l) => sameLine(action.line, l));
      if (existing) {
        return { ...state, cart: state.cart.map((l) => (l === existing ? { ...l, qty: Math.min(20, l.qty + action.line.qty) } : l)) };
      }
      return { ...state, cart: [...state.cart, { ...action.line, key: `${Date.now()}-${state.cart.length}` }] };
    }
    case 'qty':
      return {
        ...state,
        cart: state.cart
          .map((l) => (l.key === action.key ? { ...l, qty: Math.min(20, l.qty + action.delta) } : l))
          .filter((l) => l.qty > 0),
      };
    case 'useReward':
      return { ...state, useReward: action.value };
    case 'place': {
      const reward = state.useReward ? openRewards(state.card, action.now)[0] : undefined;
      const totals = cartTotals(state.cart, !!reward);
      const applied = reward && totals.rewardLine >= 0 ? reward : undefined;
      const free = totals.total === 0;
      const order: Order = {
        id: `o-${action.now}`,
        number: state.nextNumber,
        lines: state.cart,
        totals,
        method: action.method,
        // igual que create_order: en barra entra como recibido; en app espera el pago
        status: action.method === 'barra' || free ? 'recibido' : 'esperando_pago',
        isPaid: free,
        rewardId: applied?.id,
        note: action.note,
        createdAt: action.now,
      };
      return {
        ...state,
        cart: [],
        useReward: false,
        card: applied ? redeemReward(state.card, applied.id, action.now) : state.card,
        orders: [order, ...state.orders],
        nextNumber: state.nextNumber + 1,
      };
    }
    case 'advance': {
      const order = state.orders.find((o) => o.id === action.orderId);
      const next = order && NEXT[order.status];
      if (!order || !next) return state;
      // La barra cobra al entregar (pago en barra); ahí se da el sello, como mark_order_paid.
      const getsPaid = next === 'entregado' && !order.isPaid;
      let s: State = {
        ...state,
        orders: state.orders.map((o) => (o.id === order.id ? { ...o, status: next, isPaid: o.isPaid || getsPaid } : o)),
      };
      if (getsPaid) s = giveStamp(s, action.now, 'pedido');
      return s;
    }
    case 'scan':
      return giveStamp(state, action.now, 'escaneo');
    case 'dismissNotice':
      return { ...state, notice: undefined };
    case 'reset':
      return { ...initialState(), lang: state.lang };
  }
}

interface Ctx {
  state: State;
  t: Strings;
  dispatch: (a: Action) => void;
}

const StoreContext = createContext<Ctx | null>(null);
const KEY = 'junio-estado-v1';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: { ...JSON.parse(raw), notice: undefined } });
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  useEffect(() => {
    if (hydrated.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, t: strings[state.lang] }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  return ctx;
}

export { reducer as _reducerForTests, initialState as _initialStateForTests };
