\set ON_ERROR_STOP 1
insert into auth.users (id, raw_user_meta_data) values ('00000000-0000-0000-0000-000000000001','{"full_name":"Cliente"}'),('00000000-0000-0000-0000-000000000002','{"full_name":"Barista"}');
update profiles set role='barista' where id='00000000-0000-0000-0000-000000000002';
select source,status from stamps;  -- welcome
insert into menu_categories(name_es,name_en) values ('Café','Coffee'),('Postres','Desserts');
insert into menu_items(category_id,name_es,name_en,base_price,is_coffee) values (1,'Latte','Latte',65,true);
insert into menu_items(category_id,name_es,name_en,base_price,is_coffee) values (1,'Matcha','Matcha',75,false);
insert into item_options(item_id,kind,name_es,name_en,price_delta) values (1,'tamano','Grande','Large',10),(1,'extra','Shot extra','Extra shot',15);
-- same-day second stamp blocked
select set_config('test.uid','00000000-0000-0000-0000-000000000001',false);
select create_order('[{"item_id":1,"option_ids":[1],"qty":2}]','app') as o1 \gset
select total from orders where id=:'o1';
select set_config('test.uid','',false);
select mark_order_paid(:'o1','mp-1');
select mark_order_paid(:'o1','mp-1');
select set_config('test.uid','00000000-0000-0000-0000-000000000001',false);
select issue_qr_token() as tk \gset
select set_config('test.uid','00000000-0000-0000-0000-000000000002',false);
select scan_qr(:'tk');  -- ya_hoy
-- simulate 5 past days
update stamps set local_day = local_day - 10, created_at = created_at - interval '10 days';
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo') ;
update stamps set local_day = local_day - 1, created_at = created_at - interval '1 day' where source <> 'bienvenida';
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo') ;
update stamps set local_day = local_day - 1, created_at = created_at - interval '1 day' where source <> 'bienvenida';
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo') ;
update stamps set local_day = local_day - 1, created_at = created_at - interval '1 day' where source <> 'bienvenida';
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo') ;
update stamps set local_day = local_day - 1, created_at = created_at - interval '1 day' where source <> 'bienvenida';
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo') as seventh;
select status,count(*) from stamps group by 1;
select id as rw from rewards \gset
select set_config('test.uid','00000000-0000-0000-0000-000000000001',false);
select * from my_card;
-- reward on non-coffee fails
\set ON_ERROR_STOP 0
select create_order('[{"item_id":2,"qty":1}]','barra',:'rw');
\set ON_ERROR_STOP 1
select create_order('[{"item_id":2,"qty":1},{"item_id":1,"option_ids":[1,2],"qty":1}]','barra',:'rw') as o2 \gset
select subtotal,discount,total,status from orders where id=:'o2';
select redeemed_at is not null from rewards;
-- 6 month expiry
update stamps set created_at = now() - interval '7 months', local_day = local_day - 220;
insert into stamps(customer_id,source,created_at,local_day) values ('00000000-0000-0000-0000-000000000001','escaneo', now()-interval '7 months', current_date-400);
select active_stamps from my_card;
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo');
select status,count(*) from stamps group by 1;
-- customer cannot award stamps directly
set role authenticated;
\set ON_ERROR_STOP 0
select award_stamp('00000000-0000-0000-0000-000000000001','escaneo');
select mark_order_paid(:'o1');
