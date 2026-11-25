// Piezas compartidas por las funciones de Mercado Pago.
import { createClient } from 'npm:@supabase/supabase-js@2';

export const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MP_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';

/** Cliente con la service role: solo vive en el servidor, nunca en la app. */
export const admin = () => createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Llamada a la API de Mercado Pago con el Access Token guardado en los secretos de Supabase. */
export async function mp(path: string, init: RequestInit = {}) {
  if (!MP_TOKEN) throw new Error('Falta el secreto MP_ACCESS_TOKEN en Supabase');
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mercado Pago ${res.status}: ${body?.message ?? 'error'}`);
  return body;
}

/** Solo se regresa a la app de Junio (o a Expo Go mientras probamos), nunca a otra página. */
export function safeReturnUrl(v: string | null): string | null {
  if (!v) return null;
  return /^(junio|exp|exps):\/\//.test(v) ? v : null;
}
