-- Permisos de tabla para la app y el panel.
-- Los proyectos nuevos de Supabase ya no dan acceso automático a las tablas de "public"
-- (la app recibía "permission denied for table ..."). Aquí se dan a mano.
-- Qué filas ve o cambia cada quien lo siguen decidiendo las políticas RLS del esquema inicial.
-- Cada tabla nueva necesita su propio grant en su migración.

grant usage on schema public to anon, authenticated;

-- Menú y Guest Beans: lectura para todos; edición del personal (RLS: is_staff / is_owner)
grant select on menu_categories, menu_items, item_options, guest_beans to anon, authenticated;
grant insert, update, delete on menu_categories, menu_items, item_options, guest_beans to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Perfil: leer y editar el propio (RLS)
grant select, update on profiles to authenticated;

-- Tarjeta y pedidos: solo lectura; se crean con las funciones (create_order, scan_qr...)
grant select on stamps, rewards, orders, order_items to authenticated;
-- La barra mueve el estado del pedido (RLS: is_staff)
grant update on orders to authenticated;

-- qr_tokens: sin acceso directo, solo por las funciones
revoke all on qr_tokens from anon, authenticated;
