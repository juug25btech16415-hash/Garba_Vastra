-- ============================================================
-- Add video_url column to products table & support video MIME types
-- ============================================================

-- 1. Add video_url column to products table
alter table products add column if not exists video_url text;

-- 2. Ensure product-images storage bucket allows video MIME types
update storage.buckets
set allowed_mime_types = array['image/*', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'product-images';
