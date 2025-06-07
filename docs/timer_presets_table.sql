-- Создание таблицы для пресетов таймера
CREATE TABLE timer_presets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  prep INTEGER NOT NULL,
  work INTEGER NOT NULL,
  rest INTEGER NOT NULL,
  cycles INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  rest_between_sets INTEGER NOT NULL,
  desc_work TEXT,
  desc_rest TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Настройка Row Level Security (RLS) для защиты данных
ALTER TABLE timer_presets ENABLE ROW LEVEL SECURITY;

-- Политика для просмотра собственных пресетов
CREATE POLICY "Users can view their own presets" 
  ON timer_presets FOR SELECT
  USING (auth.uid() = user_id);

-- Политика для создания собственных пресетов
CREATE POLICY "Users can insert their own presets" 
  ON timer_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Политика для обновления собственных пресетов
CREATE POLICY "Users can update their own presets" 
  ON timer_presets FOR UPDATE
  USING (auth.uid() = user_id);

-- Политика для удаления собственных пресетов
CREATE POLICY "Users can delete their own presets" 
  ON timer_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Создание индекса для ускорения поиска пресетов пользователя
CREATE INDEX timer_presets_user_id_idx ON timer_presets (user_id);

-- Комментарии к таблице и полям
COMMENT ON TABLE timer_presets IS 'Сохраненные пресеты для интервального таймера';
COMMENT ON COLUMN timer_presets.user_id IS 'Идентификатор пользователя';
COMMENT ON COLUMN timer_presets.name IS 'Название пресета';
COMMENT ON COLUMN timer_presets.prep IS 'Время подготовки в секундах';
COMMENT ON COLUMN timer_presets.work IS 'Время работы в секундах';
COMMENT ON COLUMN timer_presets.rest IS 'Время отдыха в секундах';
COMMENT ON COLUMN timer_presets.cycles IS 'Количество циклов в тренировке';
COMMENT ON COLUMN timer_presets.sets IS 'Количество сетов в тренировке';
COMMENT ON COLUMN timer_presets.rest_between_sets IS 'Время отдыха между сетами в секундах';
COMMENT ON COLUMN timer_presets.desc_work IS 'Описание для фазы работы';
COMMENT ON COLUMN timer_presets.desc_rest IS 'Описание для фазы отдыха'; 