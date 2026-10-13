-- ============================================================
-- Add rental support: a product can be marked as rental-only,
-- with its own price/deposit/date-window, separate from normal
-- buy-it stock. Orders track which date was booked and whether
-- the deposit has been handed back.
-- ============================================================

alter table products add column if not exists is_rental boolean not null default false;
alter table products add column if not exists rental_price numeric;
alter table products add column if not exists rental_deposit numeric;
alter table products add column if not exists rental_start_date date;
alter table products add column if not exists rental_end_date date;
alter table products add column if not exists rental_return_hours integer not null default 24;
alter table products add column if not exists rental_eligibility text default 'Open only to Jain College students.';

alter table orders add column if not exists rental_date date;
alter table orders add column if not exists deposit_refunded boolean not null default false;

-- Lets the product page check if a rental date is already booked, WITHOUT
-- exposing any order details to the public (returns only true/false).
create or replace function is_rental_date_available(p_product_id uuid, p_date date)
returns boolean
language plpgsql
security definer
as $$
declare
  taken boolean;
begin
  select exists (
    select 1
    from orders o, jsonb_array_elements(o.items) as item
    where o.payment_status = 'paid'
      and o.rental_date = p_date
      and (item->>'productId')::uuid = p_product_id
      and (item->>'isRental')::boolean is true
  ) into taken;
  return not taken;
end;
$$;

grant execute on function is_rental_date_available(uuid, date) to anon, authenticated;

-- Belt-and-braces: even if two people somehow pay at the exact same instant,
-- the database itself refuses to let a second order be marked "paid" for a
-- date that's already booked (the application-level check above handles the
-- normal case; this is the backstop for a genuine race condition).
create unique index if not exists uniq_rental_date_paid
  on orders (rental_date)
  where payment_status = 'paid' and rental_date is not null;
