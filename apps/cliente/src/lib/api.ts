// Llamadas a Supabase. Las reglas (precios, sellos, recompensas) viven en el servidor:
// aquí solo se leen datos y se llaman las funciones create_order e issue_qr_token.
import * as Linking from 'expo-linking';

import type { Menu } from '@/data/menu';
import type { CartLine } from '@/lib/pricing';
import type { Card } from '@/lib/rewards';
import type { GuestBeans, Order, PaymentMethod } from '@/state/types';

import { supabase } from './supabase';

function db() {
  if (!supabase) throw new Error('Supabase no está configurado');
  return supabase;
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/** Fecha de Postgres a milisegundos. Postgres manda microsegundos (.755019+00:00), que no todos los motores de JS leen. */
export function ts(v: string): number {
  const iso = v.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1').replace(/\+00(:00)?$/, 'Z');
  const n = Date.parse(iso);
  return Number.isNaN(n) ? Date.now() : n;
}

export async function fetchMenu(): Promise<{ menu: Menu; beans: GuestBeans | null }> {
  const [cats, items, opts, beans] = await Promise.all([
    db().from('menu_categories').select('*').order('sort'),
    db().from('menu_items').select('*').order('sort'),
    db().from('item_options').select('*').order('id'),
    db().from('guest_beans').select('roaster, origin, notes_es, notes_en').eq('is_active', true).order('starts_on', { ascending: false }).limit(1),
  ]);
  return {
    menu: {
      categories: check(cats),
      // numeric de Postgres llega como texto
      items: (check(items) as Menu['items']).map((i) => ({ ...i, base_price: Number(i.base_price), size: i.size ?? '' })),
      options: (check(opts) as Menu['options']).map((o) => ({ ...o, price_delta: Number(o.price_delta) })),
    },
    beans: (check(beans) as GuestBeans[])[0] ?? null,
  };
}

export async function fetchCard(): Promise<Card> {
  const [stamps, rewards] = await Promise.all([
    db().from('stamps').select('source, created_at, local_day').eq('status', 'activo').order('created_at'),
    db().from('rewards').select('id, earned_at, expires_at, redeemed_at').is('redeemed_at', null),
  ]);
  type S = { source: Card['stamps'][number]['source']; created_at: string; local_day: string };
  type R = { id: string; earned_at: string; expires_at: string; redeemed_at: string | null };
  return {
    stamps: (check(stamps) as S[]).map((s) => ({ source: s.source, createdAt: ts(s.created_at), localDay: s.local_day })),
    hadWelcome: true,
    rewards: (check(rewards) as R[]).map((r) => ({
      id: r.id,
      earnedAt: ts(r.earned_at),
      expiresAt: ts(r.expires_at),
      redeemedAt: r.redeemed_at ? ts(r.redeemed_at) : undefined,
    })),
  };
}

type OrderRow = {
  id: string;
  number: number;
  status: Order['status'];
  payment_method: PaymentMethod;
  is_paid: boolean;
  subtotal: number;
  discount: number;
  total: number;
  reward_id: string | null;
  note: string | null;
  created_at: string;
  order_items: { id: number; item_id: number; option_ids: number[]; qty: number; is_reward: boolean }[];
};

export async function fetchOrders(): Promise<Order[]> {
  const rows = check(
    await db()
      .from('orders')
      .select('id, number, status, payment_method, is_paid, subtotal, discount, total, reward_id, note, created_at, order_items (id, item_id, option_ids, qty, is_reward)')
      .order('created_at', { ascending: false })
      .limit(30),
  ) as OrderRow[];
  return rows.map((o) => {
    const items = [...o.order_items].sort((a, b) => a.id - b.id);
    return {
      id: o.id,
      number: o.number,
      lines: items.map((i) => ({ key: String(i.id), itemId: i.item_id, optionIds: i.option_ids, qty: i.qty })),
      totals: {
        subtotal: Number(o.subtotal),
        discount: Number(o.discount),
        total: Number(o.total),
        rewardLine: items.findIndex((i) => i.is_reward),
      },
      method: o.payment_method,
      status: o.status,
      isPaid: o.is_paid,
      rewardId: o.reward_id ?? undefined,
      note: o.note ?? '',
      createdAt: ts(o.created_at),
    };
  });
}

export async function createOrder(lines: CartLine[], method: PaymentMethod, rewardId: string | undefined, note: string): Promise<string> {
  return check(
    await db().rpc('create_order', {
      p_items: lines.map((l) => ({ item_id: l.itemId, option_ids: l.optionIds, qty: l.qty })),
      p_method: method,
      p_reward: rewardId ?? null,
      p_note: note || null,
    }),
  ) as string;
}

export async function issueQrToken(): Promise<string> {
  return check(await db().rpc('issue_qr_token')) as string;
}

export async function fetchProfileName(): Promise<string> {
  const { data } = await db().from('profiles').select('full_name').maybeSingle();
  return (data as { full_name: string } | null)?.full_name ?? '';
}

export async function saveLang(lang: 'es' | 'en', userId: string) {
  await db().from('profiles').update({ lang }).eq('id', userId);
}

// ---------- Inicio de sesión por correo ----------
// El correo trae un enlace que abre la app en /entrar?code=... (y un código de 6 dígitos
// cuando haya SMTP propio y la plantilla incluya {{ .Token }}).

/** Dirección a la que regresa el enlace del correo: junio://entrar, o exp://.../--/entrar en Expo Go. */
export const authRedirectUrl = () => Linking.createURL('/entrar');
export async function sendCode(email: string, fullName: string) {
  const { error } = await db().auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: authRedirectUrl(),
      data: fullName ? { full_name: fullName } : undefined,
    },
  });
  if (error) throw new Error(error.message);
}

export async function verifyCode(email: string, token: string) {
  const { error } = await db().auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw new Error(error.message);
}

export async function signInFromLink(code: string) {
  const { error } = await db().auth.exchangeCodeForSession(code);
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await db().auth.signOut();
}
