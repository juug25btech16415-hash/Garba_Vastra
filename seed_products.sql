-- ============================================================
-- Seed Data for Garba Vastra - Products Table
-- Run this in your Supabase SQL Editor to populate products
-- ============================================================

INSERT INTO products (
  name,
  description,
  price,
  image_url,
  category,
  sizes,
  colors,
  stock,
  is_active,
  specifications
) VALUES
(
  'Black Raas Leela Embroidered Chaniya Choli',
  'A stunning black lehenga featuring vibrant, circular embroidered dancer motifs along the flare, finished with a traditional white border. Paired with a matching heavy blouse and dupatta.',
  1899,
  'chaniay1.jpeg',
  'Chaniya Choli',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['Black'],
  15,
  true,
  '{"MRP": "3999", "SKU": "GV-BLK-001", "Product Type": "Embroidered Lehenga", "Occasion": "Navratri, Garba", "Fabric": "Cotton Blend", "Pattern": "Applique & Mirror Work", "No Of Components": "3"}'::jsonb
),
(
  'Crimson & Cream Traditional Print Chaniya Choli',
  'An elegant cream-based lehenga with deep red and black traditional block-print motifs, featuring classic chariots and cows. Comes with a matching red printed blouse and a pure silk dupatta.',
  1899,
  'chaniay2.jpeg',
  'Chaniya Choli',
  ARRAY['M', 'L', 'XL'],
  ARRAY['Red', 'Cream'],
  8,
  true,
  '{"MRP": "3999", "SKU": "GV-RED-002", "Product Type": "Printed Lehenga", "Occasion": "Festive, Wedding Guest", "Fabric": "Silk Blend", "Pattern": "Traditional Block Print", "Sleeve Type": "Half Sleeve", "No Of Components": "3"}'::jsonb
),
(
  'Rainbow Paneled Kutchi Work Chaniya Choli',
  'A vibrant, multi-colored paneled lehenga featuring wide strips of white, pink, blue, purple, and green. Paired with a heavily embroidered sleeveless top featuring intricate Kutchi work and elephant motifs.',
  1899,
  'chaniay3.jpeg',
  'Chaniya Choli',
  ARRAY['S', 'M', 'L'],
  ARRAY['Multi Color'],
  12,
  true,
  '{"MRP": "3999", "SKU": "GV-MUL-003", "Product Type": "Paneled Lehenga", "Occasion": "Garba Night", "Fabric": "Rayon/Cotton", "Pattern": "Color-blocked with Kutchi Embroidery", "Neck Type": "Round Neck", "No Of Components": "2"}'::jsonb
);
