-- =====================================================================
-- Junio · Esquema de base de datos (Supabase / Postgres)
-- Fase 3 (Tecnología) · 2026-11-23
--
-- Reglas de Junio Rewards que este archivo aplica en el servidor:
--   * 1 sello por compra (no por bebida), máximo 1 sello por día.
--   * Todas las bebidas ganan sello; la bebida gratis solo puede ser de café.
--   * 7 sellos = la 8ª bebida gratis, cualquier tamaño, extras sin cobro.
--   * Sello de bienvenida al crear la cuenta (cuenta como 1 de los 7).
--   * Los sellos vencen si pasan 6 meses sin visita; la bebida gratis, a los 60 días.
--   * Zona horaria del local: America/Mazatlan (San José del Cabo, BCS).
-- Los precios y totales se calculan aquí, nunca se confían a la app.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos -----------------------------------------------------
create type user_role       as enum ('cliente', 'barista', 'dueno');
create type order_status    as enum ('esperando_pago', 'recibido', 'preparando', 'listo', 'entregado', 'cancelado');
create type payment_method  as enum ('app', 'barra');
create type stamp_source    as enum ('bienvenida', 'pedido', 'escaneo');
create type stamp_status    as enum ('activo', 'canjeado', 'vencido');
create type option_kind     as enum ('tamano', 'leche', 'extra');

-- ---------- Perfiles --------------------------------------------------
create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  lang        text not null default 'es' check (lang in ('es', 'en')),
  role        user_role not null default 'cliente',
  push_token  text,
  created_at  timestamptz not null default now()
);

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('barista', 'dueno'));
$$;

create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'dueno');
$$;

-- ---------- Menú ------------------------------------------------------
create table menu_categories (
  id        serial primary key,
  name_es   text not null,
  name_en   text not null,
  sort      int  not null default 0
);

create table menu_items (
  id            serial primary key,
  category_id   int not null references menu_categories (id),
  name_es       text not null,
  name_en       text not null,
  desc_es       text not null default '',
  desc_en       text not null default '',
  base_price    numeric(8,2) not null check (base_price >= 0),  -- MXN
  is_drink      boolean not null default true,   -- toda bebida gana sello
  is_coffee     boolean not null default false,  -- solo estas pueden ser la bebida gratis
  is_available  boolean not null default true,   -- "agotado" desde la barra
  photo_url     text,
  sort          int not null default 0
);

create table item_options (
  id           serial primary key,
  item_id      int not null references menu_items (id) on delete cascade,
  kind         option_kind not null,
  name_es      text not null,
  name_en      text not null,
  price_delta  numeric(8,2) not null default 0,
  is_default   boolean not null default false
);

-- Café invitado del mes (Guest Beans)
create table guest_beans (
  id          serial primary key,
  roaster     text not null,
  origin      text not null,
  notes_es    text not null default '',
  notes_en    text not null default '',
  starts_on   date not null,
  ends_on     date,
  is_active   boolean not null default true
);

-- ---------- Junio Rewards --------------------------------------------
create table rewards (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references profiles (id) on delete cascade,
  earned_at    timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '60 days',
  redeemed_at  timestamptz,
  order_id     uuid  -- pedido donde se canjeó (FK abajo)
);

create table stamps (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references profiles (id) on delete cascade,
  source       stamp_source not null,
  status       stamp_status not null default 'activo',
  order_id     uuid,                 -- FK abajo
  awarded_by   uuid references profiles (id),   -- barista que escaneó
  reward_id    uuid references rewards (id),    -- recompensa que formó
  created_at   timestamptz not null default now(),
  local_day    date not null default (now() at time zone 'America/Mazatlan')::date
);
-- Máximo 1 sello por día por cliente (el de bienvenida no cuenta para el límite)
create unique index stamps_one_per_day on stamps (customer_id, local_day) where source <> 'bienvenida';
-- Un solo sello de bienvenida por cliente
create unique index stamps_one_welcome on stamps (customer_id) where source = 'bienvenida';

-- QR rotativo de la tarjeta: token de un solo uso que vence a los 60 s
create table qr_tokens (
  token        text primary key default encode(gen_random_bytes(16), 'hex'),
  customer_id  uuid not null references profiles (id) on delete cascade,
  expires_at   timestamptz not null default now() + interval '60 seconds',
  used_at      timestamptz
);

-- ---------- Pedidos ---------------------------------------------------
create table orders (
  id              uuid primary key default gen_random_uuid(),
  number          serial,                       -- número corto que se canta en la barra
  customer_id     uuid not null references profiles (id),
  status          order_status not null default 'esperando_pago',
  payment_method  payment_method not null,
  is_paid         boolean not null default false,
  subtotal        numeric(8,2) not null default 0,
  discount        numeric(8,2) not null default 0,
  total           numeric(8,2) not null default 0,
  reward_id       uuid references rewards (id),
  mp_preference_id text,
  mp_payment_id    text unique,
  note            text,
  created_at      timestamptz not null default now(),
  ready_at        timestamptz
);

create table order_items (
  id          serial primary key,
  order_id    uuid not null references orders (id) on delete cascade,
  item_id     int  not null references menu_items (id),
  option_ids  int[] not null default '{}',
  qty         int  not null default 1 check (qty between 1 and 20),
  unit_price  numeric(8,2) not null,   -- precio base + opciones, calculado en el servidor
  is_reward   boolean not null default false
);

alter table rewards add constraint rewards_order_fk foreign key (order_id) references orders (id);
alter table stamps  add constraint stamps_order_fk  foreign key (order_id) references orders (id);

-- ---------- Lógica de sellos -----------------------------------------

-- Tarjeta del cliente: sellos activos, recompensas vigentes, último sello
create or replace view my_card with (security_invoker = true) as
select p.id as customer_id,
       case when (select max(created_at) from stamps s where s.customer_id = p.id and s.status = 'activo')
                 > now() - interval '6 months'
            then (select count(*) from stamps s where s.customer_id = p.id and s.status = 'activo')
            else 0 end as active_stamps,
       (select count(*) from rewards r where r.customer_id = p.id
          and r.redeemed_at is null and r.expires_at > now()) as open_rewards,
       (select max(created_at) from stamps s where s.customer_id = p.id) as last_visit
from profiles p
where p.id = auth.uid();

-- Otorga un sello. Devuelve 'otorgado', 'ya_hoy' o 'recompensa' (si completó los 7).
create or replace function award_stamp(p_customer uuid, p_source stamp_source, p_order uuid default null, p_by uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_last   timestamptz;
  v_count  int;
  v_reward uuid;
begin
  perform 1 from profiles where id = p_customer for update;   -- evita carreras

  if p_source <> 'bienvenida' and exists (
       select 1 from stamps where customer_id = p_customer and source <> 'bienvenida'
         and local_day = (now() at time zone 'America/Mazatlan')::date) then
    return 'ya_hoy';
  end if;

  -- 6 meses sin visita: la tarjeta se reinicia
  select max(created_at) into v_last from stamps where customer_id = p_customer and status = 'activo';
  if v_last is not null and v_last < now() - interval '6 months' then
    update stamps set status = 'vencido' where customer_id = p_customer and status = 'activo';
  end if;

  insert into stamps (customer_id, source, order_id, awarded_by)
  values (p_customer, p_source, p_order, p_by)
  on conflict do nothing;
  if not found then return 'ya_hoy'; end if;

  select count(*) into v_count from stamps where customer_id = p_customer and status = 'activo';
  if v_count >= 7 then
    insert into rewards (customer_id) values (p_customer) returning id into v_reward;
    update stamps set status = 'canjeado', reward_id = v_reward
     where id in (select id from stamps where customer_id = p_customer and status = 'activo'
                  order by created_at limit 7);
    return 'recompensa';
  end if;
  return 'otorgado';
end $$;

-- Sello de bienvenida y perfil al registrarse
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  perform award_stamp(new.id, 'bienvenida');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- QR: el cliente pide un token nuevo cada 60 s
create or replace function issue_qr_token() returns text
language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'sin sesion'; end if;
  delete from qr_tokens where customer_id = auth.uid();
  insert into qr_tokens (customer_id) values (auth.uid()) returning token into v_token;
  return v_token;
end $$;

-- QR: la barra escanea al cobrar una compra hecha en la barra (sin pedido en app)
create or replace function scan_qr(p_token text) returns text
language plpgsql security definer set search_path = public as $$
declare v_customer uuid;
begin
  if not is_staff() then raise exception 'solo personal'; end if;
  update qr_tokens set used_at = now()
   where token = p_token and used_at is null and expires_at > now()
  returning customer_id into v_customer;
  if v_customer is null then return 'qr_invalido'; end if;
  return award_stamp(v_customer, 'escaneo', null, auth.uid());
end $$;

-- ---------- Crear pedido (precios del servidor) ----------------------
-- p_items: [{"item_id":1,"option_ids":[3,7],"qty":1}, ...]
-- p_reward: recompensa a canjear (se aplica a una bebida de café; tamaño y extras gratis)
create or replace function create_order(p_items jsonb, p_method payment_method, p_reward uuid default null, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_order   uuid;
  v_line    jsonb;
  v_item    menu_items;
  v_price   numeric(8,2);
  v_sub     numeric(8,2) := 0;
  v_disc    numeric(8,2) := 0;
  v_applied boolean := false;
  v_opts    int[];
begin
  if auth.uid() is null then raise exception 'sin sesion'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'pedido vacio'; end if;

  if p_reward is not null and not exists (
      select 1 from rewards where id = p_reward and customer_id = auth.uid()
        and redeemed_at is null and expires_at > now()) then
    raise exception 'recompensa no valida o vencida';
  end if;

  insert into orders (customer_id, payment_method, note,
                      status)
  values (auth.uid(), p_method, p_note,
          case when p_method = 'barra' then 'recibido'::order_status else 'esperando_pago' end)
  returning id into v_order;

  for v_line in select * from jsonb_array_elements(p_items) loop
    select * into v_item from menu_items where id = (v_line->>'item_id')::int and is_available;
    if not found then raise exception 'producto no disponible: %', v_line->>'item_id'; end if;

    v_opts := coalesce(array(select jsonb_array_elements_text(v_line->'option_ids')::int), '{}');
    select v_item.base_price + coalesce(sum(price_delta), 0) into v_price
      from item_options where item_id = v_item.id and id = any (v_opts);

    insert into order_items (order_id, item_id, option_ids, qty, unit_price, is_reward)
    values (v_order, v_item.id, v_opts, coalesce((v_line->>'qty')::int, 1), v_price,
            p_reward is not null and not v_applied and v_item.is_coffee);

    v_sub := v_sub + v_price * coalesce((v_line->>'qty')::int, 1);
    if p_reward is not null and not v_applied and v_item.is_coffee then
      v_disc := v_price;          -- una unidad gratis, con su tamaño y extras
      v_applied := true;
    end if;
  end loop;

  if p_reward is not null and not v_applied then
    raise exception 'la bebida gratis debe ser una bebida de cafe';
  end if;

  update orders set subtotal = v_sub, discount = v_disc, total = v_sub - v_disc,
                    reward_id = p_reward,
                    -- pedido que queda en $0 por la recompensa: no pasa por Mercado Pago
                    is_paid = (v_sub - v_disc = 0),
                    status = case when v_sub - v_disc = 0 then 'recibido'::order_status else status end
   where id = v_order;

  if p_reward is not null then
    update rewards set redeemed_at = now(), order_id = v_order where id = p_reward;
  end if;
  return v_order;
end $$;

-- Marcar pagado: la llama el webhook de Mercado Pago (pago en app)
-- o la barra (pago en barra). Da el sello de la compra.
create or replace function mark_order_paid(p_order uuid, p_mp_payment text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_customer uuid; v_was_paid boolean;
begin
  -- el webhook entra con la service role (auth.uid() nulo); la barra debe ser personal
  if auth.uid() is not null and not is_staff() then raise exception 'solo personal'; end if;
  select customer_id, is_paid into v_customer, v_was_paid from orders where id = p_order for update;
  if v_customer is null then raise exception 'pedido no existe'; end if;
  update orders set is_paid = true, mp_payment_id = coalesce(p_mp_payment, mp_payment_id),
                    status = case when status = 'esperando_pago' then 'recibido' else status end
   where id = p_order;
  if v_was_paid then return 'ya_pagado'; end if;
  return award_stamp(v_customer, 'pedido', p_order, auth.uid());
end $$;

-- Nota: un pedido que queda en $0 por la recompensa no da sello (no hubo compra).
-- Si el dueño decide lo contrario, se cambia en create_order.

-- Permisos: award_stamp solo se usa desde otras funciones
revoke execute on function award_stamp(uuid, stamp_source, uuid, uuid) from public, anon, authenticated;
revoke execute on function mark_order_paid(uuid, text) from public, anon;
revoke execute on function scan_qr(text) from public, anon;
revoke execute on function issue_qr_token() from public, anon;
revoke execute on function create_order(jsonb, payment_method, uuid, text) from public, anon;
grant execute on function mark_order_paid(uuid, text), scan_qr(text), issue_qr_token(),
  create_order(jsonb, payment_method, uuid, text) to authenticated;

-- ---------- Seguridad (RLS) ------------------------------------------
alter table profiles        enable row level security;
alter table menu_categories enable row level security;
alter table menu_items      enable row level security;
alter table item_options    enable row level security;
alter table guest_beans     enable row level security;
alter table rewards         enable row level security;
alter table stamps          enable row level security;
alter table qr_tokens       enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- Perfil: cada quien el suyo; el personal ve a todos; solo el dueño cambia roles
create policy perfil_propio   on profiles for select using (id = auth.uid() or is_staff());
create policy perfil_editar   on profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = my_role());
create policy perfil_roles    on profiles for update using (is_owner());

-- Menú y Guest Beans: lectura pública; edición del personal (precios solo dueño, ver panel)
create policy menu_leer   on menu_categories for select using (true);
create policy menu_editar on menu_categories for all using (is_owner()) with check (is_owner());
create policy items_leer   on menu_items for select using (true);
create policy items_editar on menu_items for all using (is_staff()) with check (is_staff());
create policy opts_leer   on item_options for select using (true);
create policy opts_editar on item_options for all using (is_owner()) with check (is_owner());
create policy beans_leer   on guest_beans for select using (true);
create policy beans_editar on guest_beans for all using (is_staff()) with check (is_staff());

-- Sellos y recompensas: solo lectura; se crean por las funciones de arriba
create policy sellos_leer      on stamps  for select using (customer_id = auth.uid() or is_staff());
create policy recompensas_leer on rewards for select using (customer_id = auth.uid() or is_staff());

-- Pedidos: el cliente ve los suyos; el personal ve y mueve todos
create policy pedidos_leer    on orders for select using (customer_id = auth.uid() or is_staff());
create policy pedidos_estado  on orders for update using (is_staff()) with check (is_staff());
create policy lineas_leer     on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.customer_id = auth.uid() or is_staff())));

-- qr_tokens: sin políticas = nadie lee la tabla directo; solo las funciones

-- Tiempo real: la barra escucha pedidos nuevos y el cliente su estado
-- alter publication supabase_realtime add table orders;
