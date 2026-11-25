// Estado de la app: idioma, carrito, menú, tarjeta y pedidos.
//
// Con Supabase configurado (LIVE), el menú, la tarjeta y los pedidos vienen del servidor
// y se actualizan solos en tiempo real. Sin Supabase, la app corre en "versión de prueba":
// todo se guarda en el teléfono y hay botones para simular la barra.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { guestBeans as localBeans, localMenu, type Menu } from '@/data/menu';
import * as api from '@/lib/api';
import { LIVE } from '@/lib/config';
import { strings, type Lang, type Strings } from '@/lib/i18n';
import { availableLines, cartTotals, type CartLine } from '@/lib/pricing';
import {
  activeStamps,
  awardStamp,
  emptyCard,
  openRewards,
  redeemReward,
  type AwardResult,
  type Card,
} from '@/lib/rewards';
import { supabase } from '@/lib/supabase';

import type { GuestBeans, Order, OrderStatus, PaymentMethod } from './types';

export type { Order, OrderStatus, PaymentMethod } from './types';

interface State {
  lang: Lang;
  cart: CartLine[];
  useReward: boolean;
  menu: Menu;
  beans: GuestBeans | null;
  card: Card;
  orders: Order[];
  nextNumber: number; // solo versión de prueba
  notice?: AwardResult;
  // sesión (solo con Supabase)
  authReady: boolean;
  userId?: string;
  email?: string;
  name?: string;
  cardLoaded: boolean;
}

const initialState = (): State => ({
  lang: 'es',
  cart: [],
  useReward: false,
  menu: localMenu,
  beans: LIVE ? null : localBeans,
  card: LIVE ? emptyCard() : awardStamp(emptyCard(), 'bienvenida', Date.now()).card, // sello de bienvenida
  orders: [],
  nextNumber: 101,
  authReady: !LIVE,
  cardLoaded: !LIVE,
});

type Action =
  | { type: 'hydrate'; saved: Partial<State> }
  | { type: 'lang'; lang: Lang }
  | { type: 'add'; line: Omit<CartLine, 'key'> }
  | { type: 'qty'; key: string; delta: number }
  | { type: 'useReward'; value: boolean }
  | { type: 'clearCart' }
  | { type: 'dismissNotice' }
  // Supabase
  | { type: 'session'; userId?: string; email?: string }
  | { type: 'menu'; menu: Menu; beans: GuestBeans | null }
  | { type: 'card'; card: Card; now: number }
  | { type: 'orders'; orders: Order[] }
  | { type: 'name'; name: string }
  // versión de prueba
  | { type: 'place'; method: PaymentMethod; note: string; now: number }
  | { type: 'advance'; orderId: string; now: number }
  | { type: 'scan'; now: number }
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
    case 'hydrate': {
      // Con Supabase solo se guarda idioma y carrito; lo demás siempre viene del servidor
      const saved = LIVE ? { lang: action.saved.lang ?? state.lang, cart: action.saved.cart ?? state.cart } : action.saved;
      return { ...state, ...saved };
    }
    case 'lang':
      return { ...state, lang: action.lang };
    case 'add': {
      const existing = state.cart.find((l) => sameLine(action.line, l));
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((l) => (l === existing ? { ...l, qty: Math.min(20, l.qty + action.line.qty) } : l)),
        };
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
    case 'clearCart':
      return { ...state, cart: [], useReward: false };
    case 'dismissNotice':
      return { ...state, notice: undefined };

    case 'session':
      if (action.userId === state.userId) return { ...state, authReady: true, email: action.email };
      return {
        ...state,
        authReady: true,
        userId: action.userId,
        email: action.email,
        name: undefined,
        card: emptyCard(),
        orders: [],
        cardLoaded: false,
      };
    case 'menu':
      return { ...state, menu: action.menu, beans: action.beans, cart: availableLines(action.menu, state.cart) };
    case 'card': {
      // Avisar cuando la barra da un sello o se completa la tarjeta
      let notice = state.notice;
      if (state.cardLoaded) {
        const before = openRewards(state.card, action.now).length;
        const after = openRewards(action.card, action.now).length;
        if (after > before) notice = 'recompensa';
        else if (activeStamps(action.card, action.now) > activeStamps(state.card, action.now)) notice = 'otorgado';
      }
      return { ...state, card: action.card, cardLoaded: true, notice };
    }
    case 'orders':
      return { ...state, orders: action.orders };
    case 'name':
      return { ...state, name: action.name };

    case 'place': {
      const reward = state.useReward ? openRewards(state.card, action.now)[0] : undefined;
      const totals = cartTotals(state.menu, state.cart, !!reward);
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
    case 'reset':
      return { ...initialState(), lang: state.lang };
  }
}

// Qué se guarda en el teléfono
const KEY = LIVE ? 'junio-estado-live-v1' : 'junio-estado-v1';
function persisted(s: State): Partial<State> {
  if (LIVE) return { lang: s.lang, cart: s.cart };
  const { lang, cart, useReward, card, orders, nextNumber } = s;
  return { lang, cart, useReward, card, orders, nextNumber };
}

interface Ctx {
  state: State;
  t: Strings;
  live: boolean;
  dispatch: (a: Action) => void;
  /** Envía el pedido. Devuelve el id del pedido creado. */
  placeOrder: (method: PaymentMethod, note: string) => Promise<string>;
  refresh: () => Promise<void>;
  setLang: (lang: Lang) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const hydrated = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Cargar lo guardado en el teléfono
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', saved: JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
      });
  }, []);

  useEffect(() => {
    if (hydrated.current) AsyncStorage.setItem(KEY, JSON.stringify(persisted(state))).catch(() => {});
  }, [state]);

  // Sesión de Supabase
  useEffect(() => {
    if (!supabase) return;
    const apply = (s: Session | null) => dispatch({ type: 'session', userId: s?.user.id, email: s?.user.email });
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      apply(s);
      // Al entrar o renovar la sesión, volver a pedir tarjeta y pedidos con la sesión nueva
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') setTimeout(() => refreshRef.current(), 500);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    if (!LIVE) return;
    const jobs: Promise<unknown>[] = [api.fetchMenu().then((m) => dispatch({ type: 'menu', ...m }))];
    if (stateRef.current.userId) {
      jobs.push(api.fetchCard().then((card) => dispatch({ type: 'card', card, now: Date.now() })));
      jobs.push(api.fetchOrders().then((orders) => dispatch({ type: 'orders', orders })));
    }
    const results = await Promise.allSettled(jobs);
    for (const r of results) if (r.status === 'rejected') console.warn('[junio] no se pudieron cargar datos:', r.reason);
  }, []);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Datos del servidor y cambios en tiempo real (estado del pedido, sellos de la barra)
  const userId = state.userId;
  useEffect(() => {
    if (!supabase) return;
    refresh();
    if (!userId) return;
    api.fetchProfileName().then((name) => dispatch({ type: 'name', name })).catch(() => {});
    const filter = `customer_id=eq.${userId}`;
    const channel = supabase
      .channel(`cliente-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stamps', filter }, () => refresh())
      .subscribe();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const poll = setInterval(refresh, 60_000); // respaldo por si se pierde la conexión en tiempo real
    return () => {
      supabase?.removeChannel(channel);
      sub.remove();
      clearInterval(poll);
    };
  }, [userId, refresh]);

  const placeOrder = useCallback(
    async (method: PaymentMethod, note: string) => {
      const s = stateRef.current;
      const now = Date.now();
      if (!LIVE) {
        dispatch({ type: 'place', method, note, now });
        return `o-${now}`;
      }
      const reward = s.useReward ? openRewards(s.card, now)[0] : undefined;
      const usesReward = reward && cartTotals(s.menu, s.cart, true).rewardLine >= 0 ? reward.id : undefined;
      const id = await api.createOrder(s.cart, method, usesReward, note);
      dispatch({ type: 'clearCart' });
      await refresh();
      return id;
    },
    [refresh],
  );

  const setLang = useCallback((lang: Lang) => {
    dispatch({ type: 'lang', lang });
    const uid = stateRef.current.userId;
    if (LIVE && uid) api.saveLang(lang, uid).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, t: strings[state.lang], live: LIVE, placeOrder, refresh, setLang }),
    [state, placeOrder, refresh, setLang],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  return ctx;
}

export { initialState as _initialStateForTests, reducer as _reducerForTests };
