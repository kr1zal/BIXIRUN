# Интеграция с Supabase

## Обзор интеграции

Приложение BIXIRUN использует Supabase для следующих функций:

- Аутентификация пользователей (вход, регистрация, выход)
- Хранение пресетов таймера в облаке
- Синхронизация пресетов между разными устройствами пользователя

## Структура базы данных

База данных содержит следующие таблицы:

- `timer_presets` - таблица для хранения пресетов интервального таймера

### timer_presets (актуальная схема)

```sql
CREATE TABLE IF NOT EXISTS timer_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  -- Поля приложения
  prep INT4 NOT NULL DEFAULT 0,
  work INT4 NOT NULL DEFAULT 0,
  rest INT4 NOT NULL DEFAULT 0,
  cycles INT4 NOT NULL DEFAULT 1,
  sets INT4 NOT NULL DEFAULT 1,
  rest_between_sets INT4 NOT NULL DEFAULT 0,
  desc_work TEXT,
  desc_rest TEXT,
  -- Совместимость со старыми билдами
  duration INT4 DEFAULT 0,
  -- Служебные
  local_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Уникальность для синхронизации
ALTER TABLE timer_presets
  ADD CONSTRAINT IF NOT EXISTS unique_user_local_id UNIQUE (user_id, local_id);
```

## Настройка Supabase

1. Создайте проект в Supabase
2. Выполните SQL скрипт из файла `docs/timer_presets_table.sql`
3. Создайте файл `.env` в корне проекта с кредами Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Клиентская интеграция

### Клиент Supabase

Файл: `src/services/supabaseClient.ts`

- Инициализация клиента Supabase
- Функции авторизации (signIn, signUp, signOut)
- CRUD операции для пресетов таймера

### Синхронизация данных (клиент)

Файл: `src/utils/timerStorage.ts`

- Функции для работы с локальным хранилищем (AsyncStorage)
- Функции для синхронизации локальных данных с Supabase. В пакетной
  синхронизации в payload не передаётся поле `id` (во избежание конфликтов по
  PK); идентификация строк — по `(user_id, local_id)`. Поле `local_id`
  отправляется только если это валидный UUID.

## UI компоненты

### Профиль

Файл: `app/profile.tsx`

- Экран авторизации и регистрации
- Управление профилем и синхронизацией

### Селектор пресетов

Файл: `components/timer/TimerPresetSelector.tsx`

- Компонент для выбора, сохранения и удаления пресетов
- Кнопка синхронизации с Supabase

## Схема синхронизации данных

1. **Локальное сохранение**
   - Пресеты сначала сохраняются в AsyncStorage
   - Работает даже без подключения к интернету

2. **Синхронизация с облаком**
   - При нажатии на кнопку синхронизации
   - При операциях добавления/удаления пресетов (если пользователь залогинен)

3. **Разрешение конфликтов**
   - При синхронизации приоритет отдается облачным данным
   - Локальные пресеты добавляются, если нет дубликатов

## Безопасность данных

1. **Row Level Security (RLS)**
   - Настроены политики доступа на уровне строк
   - Пользователи могут видеть и изменять только свои пресеты

2. **Авторизация**
   - Email/password авторизация через Supabase Auth
   - Токен сессии хранится в AsyncStorage

## Код интеграции

Основные компоненты для интеграции с Supabase:

1. **supabaseClient.ts** - настройка клиента и основные функции
2. **timerStorage.ts** - синхронизация между локальным и облачным хранилищем
3. **profile.tsx** - UI для авторизации и управления профилем
4. **TimerPresetSelector.tsx** - интерфейс для работы с пресетами

## Тестирование интеграции

Для проверки работы синхронизации:

1. Зарегистрируйтесь в приложении
2. Создайте несколько пресетов таймера
3. Нажмите кнопку синхронизации
4. Проверьте таблицу `timer_presets` в Supabase
5. Залогиньтесь на другом устройстве и синхронизируйте данные
