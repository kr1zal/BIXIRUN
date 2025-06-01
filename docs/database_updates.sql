-- Create the timer_presets table if it doesn't exist
CREATE TABLE IF NOT EXISTS timer_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE timer_presets ENABLE ROW LEVEL SECURITY;

-- Обновление таблицы timer_presets для улучшения производительности синхронизации

-- Добавление столбца updated_at для отслеживания изменений
ALTER TABLE timer_presets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Добавление столбца local_id для связывания локальных и облачных данных
ALTER TABLE timer_presets ADD COLUMN IF NOT EXISTS local_id UUID;

-- Создание индекса для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_timer_presets_user_id ON timer_presets(user_id);

-- Создание индекса для быстрого поиска по local_id
CREATE INDEX IF NOT EXISTS idx_timer_presets_local_id ON timer_presets(local_id);

-- Добавление триггера для автоматического обновления updated_at при изменении записи
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_timer_presets_updated_at ON timer_presets;
CREATE TRIGGER update_timer_presets_updated_at
BEFORE UPDATE ON timer_presets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Оптимизация RLS политик для более эффективного доступа
DROP POLICY IF EXISTS "Users can view their own timer presets" ON timer_presets;
CREATE POLICY "Users can view their own timer presets" 
ON timer_presets FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own timer presets" ON timer_presets;
CREATE POLICY "Users can insert their own timer presets" 
ON timer_presets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own timer presets" ON timer_presets;
CREATE POLICY "Users can update their own timer presets" 
ON timer_presets FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own timer presets" ON timer_presets;
CREATE POLICY "Users can delete their own timer presets" 
ON timer_presets FOR DELETE 
USING (auth.uid() = user_id);

-- Добавление ограничения уникальности для предотвращения дублирования
ALTER TABLE timer_presets 
DROP CONSTRAINT IF EXISTS unique_user_local_id;

ALTER TABLE timer_presets
ADD CONSTRAINT unique_user_local_id UNIQUE (user_id, local_id);
CREATE UNIQUE INDEX idx_timer_presets_user_local_id ON timer_presets (user_id, local_id) WHERE local_id IS NOT NULL; 