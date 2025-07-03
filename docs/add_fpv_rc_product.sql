INSERT INTO products (
  name, 
  price, 
  old_price, 
  discount, 
  images, 
  description, 
  specs, 
  category
) VALUES (
  'FPV RC',
  '2990',
  '3990', 
  -25,
  ARRAY[
    'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/products/clothing/t-shirt/fpvRC/FPV_RC1_1_11zon.webp',
    'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/products/clothing/t-shirt/fpvRC/FPV_RC2_2_11zon.webp',
    'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/products/clothing/t-shirt/fpvRC/FPV_RC3_3_11zon.webp',
    'https://wesrkttwjuvclvfkuxzx.supabase.co/storage/v1/object/public/products/clothing/t-shirt/fpvRC/FPV_RC4_4_11zon.webp'
  ],
  'Футболка FPV RC для любителей дронов и радиоуправляемых моделей. Стильный принт с тематикой FPV полетов и RC техники.',
  '{
    "Размеры": "2XL",
    "Материал": "Кулирка 230гр, 92% хлопок, 8% эластан",
    "Цвет": "Черный",
    "Принт": "FPV RC",
    "Крой": "Классический",
    "Уход": "Машинная стирка 30°C",
    "Страна производства": "Россия",
    "Коллекция": "2024",
    "Особенности": "Дышащая ткань, устойчивый принт"
  }'::jsonb,
  'clothing'
); 