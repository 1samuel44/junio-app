-- Prueba del menú inicial. Correr después de prueba-stub-auth.sql y de todas las migraciones.
\set ON_ERROR_STOP 1
select (select count(*) from menu_categories) as categorias,
       (select count(*) from menu_items) as productos,
       (select count(*) from menu_items where is_coffee) as de_cafe,
       (select count(*) from item_options) as opciones;
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000aa');
select set_config('test.uid','00000000-0000-0000-0000-0000000000aa',false);
-- Latte (4) con leche de avena y shot de espresso: 80 + 20 + 20 = 120
select create_order(
  jsonb_build_array(jsonb_build_object('item_id', 4, 'qty', 1, 'option_ids',
    (select jsonb_agg(id) from item_options where item_id = 4 and name_es in ('Leche de avena', 'Shot de espresso'))),
    jsonb_build_object('item_id', 25, 'qty', 1)),
  'barra') as o \gset
select subtotal, total, status from orders where id = :'o';
-- el panel puede agregar productos nuevos sin chocar con los ids del menú inicial
insert into menu_categories (name_es, name_en) values ('Prueba', 'Test') returning id;
