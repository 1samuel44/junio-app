// Mercado Pago avisa aquí cuando cambia un pago. No confiamos en lo que trae el aviso:
// volvemos a pedir el pago a la API de Mercado Pago, y solo si está aprobado y cubre
// el total del pedido lo marcamos pagado (mark_order_paid también da el sello).
import { admin, json, mp } from '../_shared/comun.ts';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const type = body?.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const paymentId = body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id');

  // Otros avisos (órdenes de comercio, pruebas del panel): solo contestar que llegó
  if (type !== 'payment' || !paymentId) return json({ ok: true, ignorado: true });

  try {
    const pago = await mp(`/v1/payments/${encodeURIComponent(String(paymentId))}`);
    if (pago.status !== 'approved') return json({ ok: true, estado: pago.status });

    const db = admin();
    const { data: order } = await db
      .from('orders')
      .select('id, total, is_paid')
      .eq('id', pago.external_reference)
      .maybeSingle();
    if (!order) return json({ ok: true, ignorado: 'pedido no existe' });
    if (order.is_paid) return json({ ok: true, ya_pagado: true });
    if (pago.currency_id !== 'MXN' || Number(pago.transaction_amount) + 0.001 < Number(order.total)) {
      console.error('pago no cubre el pedido', { order: order.id, pago: pago.id, monto: pago.transaction_amount });
      return json({ ok: true, ignorado: 'monto no coincide' });
    }

    const { data, error } = await db.rpc('mark_order_paid', { p_order: order.id, p_mp_payment: String(pago.id) });
    if (error) throw new Error(error.message);
    return json({ ok: true, sello: data });
  } catch (e) {
    // 500 hace que Mercado Pago vuelva a intentar el aviso más tarde
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
