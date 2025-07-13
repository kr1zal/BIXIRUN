# BIXIRUN Documentation

Полная техническая документация проекта BIXIRUN.

## 📋 Структура документации

### 🏠 Корневые документы

- [`../PRODUCT_CARDS_COMPLETE.md`](../PRODUCT_CARDS_COMPLETE.md) - Полное
  руководство по продуктовым карточкам **[БУДЕТ ПЕРЕНЕСЕНО]**
- [`../NAVIGATION_ERROR.md`](../NAVIGATION_ERROR.md) - Хронология исправлений
  меню навигации **[БУДЕТ ВКЛЮЧЕНО В CHANGELOG]**
- [`BLOG_UI_UX_MODERNIZATION_SUMMARY.md`](./BLOG_UI_UX_MODERNIZATION_SUMMARY.md) -
  Сводка модернизации UI/UX блога **[НОВЫЙ 2024-12-25]**

### 📁 Организованная документация

#### 🛒 [Catalog](./catalog/) **[НОВАЯ СТРУКТУРА]**

Документация каталога товаров:

- [`CURRENT_STATE.md`](./catalog/CURRENT_STATE.md) - Текущее состояние системы,
  компоненты, API, известные проблемы
- [`ARCHITECTURE.md`](./catalog/ARCHITECTURE.md) - Архитектура, структура
  файлов, зависимости, типы данных
- [`PERFORMANCE.md`](./catalog/PERFORMANCE.md) - Оптимизация производительности,
  FlatList, мемоизация
- [`CHANGELOG.md`](./catalog/CHANGELOG.md) - Хронология изменений, решенные
  проблемы, история багов

#### 🔧 [Development](./development/)

Логи разработки и анализы:

- [`ARTICLES_DEVELOPMENT_LOG.md`](./development/ARTICLES_DEVELOPMENT_LOG.md) -
  Хронология разработки системы статей **[ОБНОВЛЕНО 2024-12-25: добавлена
  модернизация UI/UX]**
- [`BLOG_UI_UX_IMPROVEMENTS.md`](./development/BLOG_UI_UX_IMPROVEMENTS.md) -
  Детальная документация UI/UX улучшений блога **[НОВЫЙ 2024-12-25]**
- [`TIMER_VIDEO_RECORDING_CHRONOLOGY.md`](./development/TIMER_VIDEO_RECORDING_CHRONOLOGY.md) -
  Разработка видеозаписи таймера
- [`TIMER_VIDEO_ANALYSIS.md`](./development/TIMER_VIDEO_ANALYSIS.md) - Анализ
  реализации видеозаписи

#### ⚙️ [Implementation](./implementation/)

Техническая реализация основных модулей:

- [`AUTH_IMPLEMENTATION.md`](./implementation/AUTH_IMPLEMENTATION.md) -
  Реализация аутентификации
- [`DEEP_LINKS_SETUP.md`](./implementation/DEEP_LINKS_SETUP.md) - Настройка deep
  links
- [`NATIVE_MODULE_PLAN.md`](./implementation/NATIVE_MODULE_PLAN.md) - План
  нативных модулей
- [`TECH_SPEC.md`](./implementation/TECH_SPEC.md) - Техническая спецификация
  проекта
- [`BLOG_UI_TECHNICAL_SPEC.md`](./implementation/BLOG_UI_TECHNICAL_SPEC.md) -
  Техническая спецификация UI/UX блога **[НОВЫЙ 2024-12-25]**

#### 🛠️ [Fixes](./fixes/)

Исправления и решения проблем:

- [`WEBSOCKET_FIX.md`](./fixes/WEBSOCKET_FIX.md) - Исправление WebSocket
  соединений
- [`ZLIB_WEBSOCKET_FIX.md`](./fixes/ZLIB_WEBSOCKET_FIX.md) - Исправление zlib в
  WebSocket

#### 🗄️ [Database](./database/)

База данных и миграции:

- [`migrations/`](./database/migrations/) - SQL миграции и обновления схемы
- [`tables/`](./database/tables/) - Определения таблиц

#### ⚡ [Optimization](./optimization/)

Гайды по оптимизации:

- [`OPTIMIZATION_GUIDE.md`](./optimization/OPTIMIZATION_GUIDE.md) - Общий гайд
  по оптимизации
- [`supabase_integration.md`](./optimization/supabase_integration.md) -
  Интеграция с Supabase
- [`supabase_optimizations.md`](./optimization/supabase_optimizations.md) -
  Оптимизация Supabase

#### 📚 [Archive](./archive/)

Архивная документация:

- [`product-cards/`](./archive/product-cards/) - Устаревшие файлы по продуктовым
  карточкам **[14 файлов - БУДУТ КОНСОЛИДИРОВАНЫ]**

## 🔍 Как найти нужную информацию

### По типу задачи:

- **Разработка новой фичи** → `implementation/`
- **Исправление бага** → `fixes/` или `catalog/CHANGELOG.md`
- **Оптимизация производительности** → `optimization/` или
  `catalog/PERFORMANCE.md`
- **Работа с базой данных** → `database/`
- **Каталог товаров** → `catalog/` **[НОВАЯ СТРУКТУРА]**
- **Проблемы с навигацией** → `catalog/CHANGELOG.md`

### По технологии:

- **React Native** → `implementation/TECH_SPEC.md`
- **Supabase** → `optimization/supabase_*.md`
- **Redux** → `development/ARTICLES_DEVELOPMENT_LOG.md`
- **Аутентификация** → `implementation/AUTH_IMPLEMENTATION.md`
- **Таймер/Видео** → `development/TIMER_*.md`
- **Каталог/Product Cards** → `catalog/` **[НОВАЯ СТРУКТУРА]**

## 📝 Соглашения документации

1. **Корневые документы** - ключевые руководства, которые нужны постоянно
2. **Тематические папки** - группировка по функциональности
3. **Хронологический порядок** - от новых к старым в каждом файле
4. **Кросс-ссылки** - связи между связанными документами
5. **Архивирование** - устаревшие документы в `archive/`

## 🔗 Быстрые ссылки

- [Текущее состояние каталога](./catalog/CURRENT_STATE.md) **[НОВЫЙ]**
- [Архитектура каталога](./catalog/ARCHITECTURE.md) **[НОВЫЙ]**
- [Оптимизация каталога](./catalog/PERFORMANCE.md) **[НОВЫЙ]**
- [История изменений каталога](./catalog/CHANGELOG.md) **[НОВЫЙ]**
- [Техническая спецификация](./implementation/TECH_SPEC.md)
- [Лог разработки статей](./development/ARTICLES_DEVELOPMENT_LOG.md)
