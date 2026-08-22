-- Migration: Add awb_number column to orders table for Shiprocket tracking
alter table if exists orders 
add column if not exists awb_number text;

-- Update get_order_status function to include awb_number
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
