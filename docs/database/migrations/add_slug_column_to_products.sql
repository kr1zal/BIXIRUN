-- Добавляет колонку 'slug' в таблицу 'products' для использования в URL.
-- slug должен быть уникальным для каждого товара.

ALTER TABLE public.products
ADD COLUMN slug TEXT;

ALTER TABLE public.products
ADD CONSTRAINT products_slug_key UNIQUE (slug);

COMMENT ON COLUMN public.products.slug IS 'Уникальный идентификатор товара для URL (например, "l-carnitine-120-caps").'; 