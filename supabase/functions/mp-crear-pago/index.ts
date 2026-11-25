// La app llama aquí después de create_order con "Pagar en la app".
// Crea el cobro (preferencia de Checkout Pro) por el total que calculó el servidor
// y regresa el enlace de pago. El precio nunca viene de la app.
import { admin, cors, json, mp, safeReturnUrl, SUPABASE_URL } from '../_shared/comun.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const db = admin();
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await db.auth.getUser(token);
    if (!auth?.user) return json({ error: 'sin sesion' }, 401);

    const { order_id, return_url } = await req.json();
    const back = safeReturnUrl(return_url);
    if (!order_id || !back) return json({ error: 'datos incompletos' }, 400);

    const { data: order } = await db
      .from('orders')
      .select('id, number, customer_id, status, payment_method, is_paid, total')
      .eq('id', order_id)
      .maybeSingle();
    if (!order || order.customer_id !== auth.user.id) return json({ error: 'pedido no existe' }, 404);
    if (order.payment_method !== 'app' || order.is_paid || order.status !== 'esperando_pago') {
      return json({ error: 'este pedido no espera pago' }, 409);
    }

    // Al terminar, Mercado Pago manda al cliente a mp-regreso, que lo regresa a la app
    const regreso = `${SUPABASE_URL}/functions/v1/mp-regreso?to=${encodeURIComponent(back)}`;
    const pref = await mp('/checkout/preferences', {
      method: 'POST',
      headers: { 'X-Idempotency-Key': `pref-${order.id}-${Date.now()}` },
      body: JSON.stringify({
        items: [
          {
            id: order.id,
            title: `Junio y Café · Pedido #${order.number}`,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: Number(order.total),
          },
        ],
        payer: auth.user.email ? { email: auth.user.email } : undefined,
        external_reference: order.id,
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        back_urls: { success: regreso, pending: regreso, failure: regreso },
        auto_return: 'approved',
        statement_descriptor: 'JUNIO Y CAFE',
        // el enlace de pago vence en 30 minutos
        expires: true,
        expiration_date_to: new Date(Date.now() + 30 * 60_000).toISOString(),
      }),
    });

    await db.from('orders').update({ mp_preference_id: pref.id }).eq('id', order.id);
    return json({ url: pref.init_point });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
