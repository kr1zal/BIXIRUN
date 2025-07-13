-- SQL-скрипт для создания таблицы `articles`
-- Версия: 1.0
-- Дата: 2024-07-29

CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT UNIQUE, -- URL источника для проверки на дубликаты
    title TEXT NOT NULL, -- Финальный заголовок
    content_markdown TEXT, -- Финальный контент в Markdown
    summary TEXT, -- Краткое превью для карточки
    cover_image_url TEXT, -- URL обложки из Supabase Storage
    status TEXT NOT NULL DEFAULT 'draft', -- Статусы: 'draft', 'processing', 'published', 'error'
    published_at TIMESTAMPTZ, -- Дата публикации
    created_at TIMESTAMPTZ DEFAULT NOW(),
    raw_content JSONB, -- (Опционально) для хранения исходного контента
    processing_log JSONB -- (Опционально) для логов обработки
);

-- Комментарии к таблице и колонкам для ясности
COMMENT ON TABLE articles IS 'Таблица для хранения статей блога, управляемых автоматизированным контент-пайплайном.';
COMMENT ON COLUMN articles.status IS 'Статус жизненного цикла статьи: draft (черновик), processing (в обработке AI), published (опубликовано), error (ошибка обработки).';
COMMENT ON COLUMN articles.source_url IS 'Уникальный URL исходной статьи для предотвращения дублирования.';
COMMENT ON COLUMN articles.content_markdown IS 'Обработанный и готовый к публикации контент в формате Markdown.';
COMMENT ON COLUMN articles.cover_image_url IS 'URL на сгенерированную обложку, хранящуюся в Supabase Storage.';
COMMENT ON COLUMN articles.processing_log IS 'Логи для отладки процесса обработки статьи.';

-- (Опционально) Создание индексов для ускорения запросов
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);

-- Включаем Row Level Security (RLS) для таблицы
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Политика доступа: разрешаем публичное чтение только опубликованных статей
CREATE POLICY "Public can read published articles"
ON articles FOR SELECT
TO anon, authenticated
USING (status = 'published' AND published_at <= NOW());

-- Политика доступа: разрешаем полный доступ для администраторов (service_role)
-- Это позволит нашим Edge Functions (которые работают с service_role) управлять статьями
CREATE POLICY "Admins can manage articles"
ON articles FOR ALL
TO service_role
USING (true); 