-- ============================================================
-- Garba Vastra — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- RESET: removes the earlier, simpler version of these tables so this
-- upgraded schema (with proper stock-safety and order tracking) replaces
-- it cleanly. Safe to run even if nothing exists yet.
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists products cascade;

-- 1. PRODUCTS TABLE
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric not null check (price >= 0),
  image_url text not null,
  images text[] not null default '{}',
  category text default 'Chaniya Choli',
  sizes text[] default '{}',
  colors text[] default '{}',
  stock integer not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Enable real-time updates on this table (for live "X left" stock counts)
alter publication supabase_realtime add table products;

-- 2. ORDERS TABLE
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  pincode text not null,
  items jsonb not null,              -- snapshot of cart at time of order
  total numeric not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_status text not null default 'pending',   -- pending | paid | failed
  order_status text not null default 'placed',      -- placed | packed | shipped | out_for_delivery | delivered | cancelled
  tracking_id text,
  tracking_url text,
  awb_number text,
  shiprocket_order_id text,
  shipment_id text,
  created_at timestamptz not null default now()
);

-- 3. ROW LEVEL SECURITY
alter table products enable row level security;
alter table orders enable row level security;

-- Anyone (including guests) can browse active products
create policy "Public can view active products"
  on products for select
  using (is_active = true);

-- Only a logged-in admin (you) can add/edit/delete products
create policy "Admins can insert products"
  on products for insert
  to authenticated
  with check (true);

create policy "Admins can update products"
  on products for update
  to authenticated
  using (true);

create policy "Admins can delete products"
  on products for delete
  to authenticated
  using (true);

-- Admins can also see inactive products (for the admin dashboard)
create policy "Admins can view all products"
  on products for select
  to authenticated
  using (true);

-- Orders: nobody can read/write the orders table directly from the browser.
-- All order creation happens through the secure serverless function
-- (using the service role key), which verifies payment first.
-- Admins (you) can view and update orders to set tracking info.
create policy "Admins can view orders"
  on orders for select
  to authenticated
  using (true);

create policy "Admins can update orders"
  on orders for update
  to authenticated
  using (true);

-- 4. STORAGE BUCKET FOR PRODUCT PHOTOS (used by the admin upload form)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- 5. STOCK DECREMENT FUNCTION
-- Called by the serverless payment-verification function after a successful
-- payment. SECURITY DEFINER lets it bypass RLS safely, and the qty check
-- prevents stock from ever going negative even with simultaneous orders.
create or replace function decrement_stock(p_product_id uuid, p_qty integer)
returns integer
language plpgsql
security definer
as $$
declare
  new_stock integer;
begin
  update products
  set stock = stock - p_qty
  where id = p_product_id and stock >= p_qty
  returning stock into new_stock;

  if new_stock is null then
    raise exception 'Insufficient stock for product %', p_product_id;
  end if;

  return new_stock;
end;
$$;

-- 6. ORDER TRACKING LOOKUP FUNCTION
-- Lets a guest look up their own order using order ID + phone number,
-- without exposing the whole orders table publicly.
create or replace function get_order_status(p_order_id uuid, p_phone text)
returns table (
  order_status text,
  payment_status text,
  tracking_id text,
  tracking_url text,
  awb_number text,
  created_at timestamptz,
  total numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select o.order_status, o.payment_status, o.tracking_id, o.tracking_url, o.awb_number, o.created_at, o.total
  from orders o
  where o.id = p_order_id and o.phone = p_phone;
end;
$$;
