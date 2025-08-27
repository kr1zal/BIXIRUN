-- Шаг 1: Устанавливаем расширение, если оно еще не установлено.
-- unaccent помогает преобразовывать символы с диакритическими знаками (например, "é" в "e") и некоторые кириллические символы.
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Шаг 2: Создаем или заменяем нашу функцию для генерации УНИКАЛЬНЫХ "слагов".
-- Теперь она принимает не только текст, но и ID записи.
CREATE OR REPLACE FUNCTION public.slugify_unique(
  v_text TEXT,
  v_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
BEGIN
  -- 1. Приводим к нижнему регистру и транслитерируем
  v_slug := lower(unaccent(v_text));
  
  -- 2. Заменяем все, что не является буквой или цифрой, на дефис
  v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
  
  -- 3. Убираем лишние дефисы в начале или конце
  v_slug := trim(both '-' FROM v_slug);
  
  -- 4. Добавляем короткую часть UUID для гарантии уникальности
  v_slug := v_slug || '-' || substr(v_id::text, 1, 8);
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Шаг 3: Обновляем все товары, у которых поле slug еще не заполнено.
-- Теперь вызываем новую функцию, передавая в нее имя и ID товара.
UPDATE public.products
SET slug = public.slugify_unique(name, id)
WHERE slug IS NULL; 