// Mercado Pago solo regresa a páginas web. Esta página manda al cliente de vuelta a la app
// (junio://... o exp://... en Expo Go). El estado del pago lo decide el webhook, no esta página.
import { safeReturnUrl } from '../_shared/comun.ts';

Deno.serve((req) => {
  const url = new URL(req.url);
  const to = safeReturnUrl(url.searchParams.get('to'));
  if (!to) return new Response('Regresa a la app de Junio.', { status: 400 });
  const dest = new URL(to);
  const status = url.searchParams.get('status') ?? url.searchParams.get('collection_status');
  if (status) dest.searchParams.set('pago', status);
  return new Response(null, { status: 302, headers: { Location: dest.toString() } });
});
