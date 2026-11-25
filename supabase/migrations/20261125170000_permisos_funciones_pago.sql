-- Etapa 3 (Mercado Pago): las funciones mp-crear-pago y mp-webhook usan la service role.
-- Este proyecto no da permisos automáticos, así que se dan a mano (RLS no aplica a la service role).
grant usage on schema public to service_role;
grant select, update on orders to service_role;
grant select on order_items, menu_items, profiles to service_role;
grant execute on function mark_order_paid(uuid, text) to service_role;
