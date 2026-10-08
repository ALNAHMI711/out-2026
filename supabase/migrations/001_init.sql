create extension if not exists pgcrypto;

create table if not exists profiles(
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check(role in('owner','admin','viewer')),
  created_at timestamptz default now()
);

create table if not exists designs(
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  thumbnail_url text,
  prompt text,
  ai_engine text not null,
  resolution text not null default '1024x1024',
  dpi integer default 300,
  status text not null default 'generated' check(status in('generated','uploading','uploaded','failed','archived')),
  pod_platforms jsonb default '[]'::jsonb,
  file_size_bytes bigint,
  checksum text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table designs enable row level security;
drop policy if exists designs_owner_only on designs;
create policy designs_owner_only on designs for all
using(auth.uid() in(select id from profiles where role in('owner','admin')))
with check(auth.uid() in(select id from profiles where role in('owner','admin')));

create table if not exists products(
  id uuid primary key default gen_random_uuid(),
  design_id uuid references designs(id) on delete restrict,
  slug text unique not null,
  name_ar text not null,
  name_en text not null,
  name_es text,
  price_cents integer not null check(price_cents>0),
  currency text not null default 'USD',
  category text not null,
  stock integer default 0 check(stock>=0),
  sales_count integer default 0,
  rating numeric(3,2) default 5.00,
  is_active boolean default false,
  created_at timestamptz default now()
);
alter table products enable row level security;
drop policy if exists products_public_read on products;
create policy products_public_read on products for select using(is_active=true);
drop policy if exists products_owner_write on products;
create policy products_owner_write on products for all
using(auth.uid() in(select id from profiles where role in('owner','admin')))
with check(auth.uid() in(select id from profiles where role in('owner','admin')));

create table if not exists orders(
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_email text not null,
  customer_name text not null,
  items jsonb not null,
  subtotal_cents integer not null,
  shipping_cents integer default 0,
  total_cents integer not null,
  currency text default 'USD',
  status text not null default 'pending' check(status in('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  pod_order_id text,
  pod_platform text,
  tracking_number text,
  tracking_url text,
  shipping_country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table orders enable row level security;
drop policy if exists orders_owner_only on orders;
create policy orders_owner_only on orders for all
using(auth.uid() in(select id from profiles where role in('owner','admin')))
with check(auth.uid() in(select id from profiles where role in('owner','admin')));

create table if not exists audit_log(
  id bigserial primary key,
  actor_id uuid references profiles(id),
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz default now()
);
alter table audit_log enable row level security;
drop policy if exists audit_owner_only on audit_log;
create policy audit_owner_only on audit_log for select
using(auth.uid() in(select id from profiles where role='owner'));

create index if not exists idx_designs_category on designs(category) where status='uploaded';
create index if not exists idx_products_active on products(is_active) where is_active=true;
create index if not exists idx_products_category on products(category);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_audit_actor on audit_log(actor_id,created_at desc);
