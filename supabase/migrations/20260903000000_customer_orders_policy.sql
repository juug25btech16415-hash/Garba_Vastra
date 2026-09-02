-- Migration: Allow authenticated users to view their own orders
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.jwt()->>'email' = email);
