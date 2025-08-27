## Документация проекта — каталог и канонические ссылки

### Канонические разделы

- Implementation: `docs/implementation/`
- Development logs: `docs/development/`
- Fixes: `docs/fixes/`
- Catalog (товары/карточки): `docs/catalog/`
- Optimization: `docs/optimization/`
- Legal: `docs/legal/`
- Archive (устаревшее): `docs/archive/`

### Каноничные документы

- Архитектура и спецификации: `implementation/TECH_SPEC.md`
- Профиль/UX: `implementation/PROFILE.md`
- Аутентификация: `implementation/AUTH_IMPLEMENTATION.md`
- Deep Links: `implementation/DEEP_LINKS_SETUP.md`
- Нативные модули: `implementation/NATIVE_MODULE_PLAN.md`
- UI/UX Блог: `implementation/BLOG_UI_TECHNICAL_SPEC.md`
- Legal: `legal/LEGAL_PAGES_SPEC.md`, `legal/APP_STORE_READINESS.md`
- Каталог: `catalog/ARCHITECTURE.md`, `catalog/CURRENT_STATE.md`,
  `catalog/PERFORMANCE.md`, `catalog/CHANGELOG.md`,
  `catalog/OPTIMIZATION_PLAN.md`
- Оптимизация: `optimization/OPTIMIZATION_GUIDE.md`,
  `optimization/supabase_integration.md`,
  `optimization/supabase_optimizations.md`
- Разработка/логи: `development/ARTICLES_DEVELOPMENT_LOG.md`,
  `BLOG_UI_UX_IMPROVEMENTS.md`, `TIMER_*`
- Фиксы: `fixes/WEBSOCKET_FIX.md`, `fixes/ZLIB_WEBSOCKET_FIX.md`

### Корневые файлы (устаревшие/разрозненные) → перенаправления

- `PRODUCT_CARDS_COMPLETE.md` → см. `docs/catalog/*` (ARCHITECTURE, PERFORMANCE,
  CHANGELOG)
- `NAVIGATION_ERROR.md` → см. `docs/catalog/CHANGELOG.md`
- `README_TIMER_FIX.md` → см. `docs/development/TIMER_*` и `fixes/*`
- `TIMER_ANALYSIS_AND_FIX.md` → объединено в `docs/development/TIMER_*`

### Архив

- `docs/archive/product-cards/*` — исторические документы по карточкам товара,
  всё актуальное перенесено в `docs/catalog/*`.

### Правила ведения документации

1. Новый контент — только в соответствующем каноническом разделе.
2. Корневые `.md` не использовать; добавлять баннер‑ссылку на канон.
3. Дубликаты — вычищать; устаревшее переносить в `archive/` с пометкой даты.
4. В `docs/README.md` поддерживать актуальные ссылки и быстрые переходы.
