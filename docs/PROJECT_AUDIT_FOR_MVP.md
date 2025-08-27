# PROJECT_AUDIT_AND_LEVEL

> Чек‑лист доработок для продакшен‑релиза iOS.

## 1) Текущее состояние (факты)

- Стек: Expo SDK 53, React Native 0.79, React 19, `expo-router`, Redux Toolkit,
  Reanimated v3, Supabase (`@supabase/supabase-js`).
- iOS нативка: `ios/BIXIRUN/TimerVideoRecorder.swift` (AVFoundation), bridge
  `.m`, пермишены и `PrivacyInfo.xcprivacy` подключены, deeplink `bixirun://`
  есть.
- Фичи: каталог/деталь/галерея, корзина, профиль (аватар), таймер (UI/логика),
  экран `app/checkout.tsx` (моки YooKassa/SBP/card), блог/статьи.
- БД/сервер: Supabase + миграции (products, slugs, timer_presets); edge‑функции
  для статей. Таблицы и функции платежей не реализованы.
- Тесты: автоматические unit/E2E отсутствуют (в репозитории). CI/CD и
  аналитика/крэши не подключены явно.
- UI polish: skeleton/Lottie отсутствуют (помечено как «не реализовано»).
  Оптимизации FlatList и мемоизация — частично.

## 2) Сильные стороны реализации

- Современная конфигурация RN (новая архитектура), глубокая интеграция Expo и
  нативки.
- Собственный iOS модуль записи видео с AVFoundation, корректные пермишены и
  линкинг.
- Техспеки, чек‑листы и документация (включая платежные процессы:
  идемпотентность, webhooks, 54‑ФЗ, return_url).
- Чистая навигация, единый стиль, продуманные UX‑мелочи (скрытие таббара на
  `/checkout`, хаптики и т.д.).

## 3) Зоны роста/риски

- Платежи: нет продакшен‑бэкенда (Edge Functions create/webhook, таблицы
  `orders/payments/webhook_events`, чек 54‑ФЗ, идемпотентность).
- Тесты: нет Jest/Detox. Для платежей критично иметь E2E и smoke‑набор.
- Наблюдаемость: нет Sentry/Crashlytics и событийной аналитики по checkout.
- Структура: монолитность отдельных экранов/дубли карточек (усложняет
  поддержку).
- CI/CD: нет EAS/fastlane pipeline и автоматических проверок на PR.

## 4) Оценка уровня разработчика (по проекту)

- Mobile RN: уверенный middle+ → senior‑уровень (новая архитектура RN, нативка
  Swift, системное проектирование).
- Backend/Payments: крепкий middle по дизайну решений
  (идемпотентность/webhooks/54‑ФЗ учтены), требуется реализация.
- Инженерная зрелость: высокая по документации/архитектуре; добить
  автотесты/наблюдаемость/CI — и это «production‑ready senior delivery».

Чек‑лист доведения до продакшена (iOS релиз)

### 0. Быстрый iOS‑релиз (что делаем сейчас)

- [ ] Сборка/конфиг (обязательно для стабильного релиза)
  - [x] Добавить `react-native-reanimated/plugin` в `babel.config.js` (последним
        плагином)
  - [x] Упростить `metro.config.js` и `polyfills.ts`: оставить только
        действительно нужные полифилы (`buffer`, `process`), удалить Node‑шимы
        (`react-native-tcp`, `stream-http`, `https-browserify`,
        `browserify-zlib`, `path-browserify`) если после чистки всё работает
  - [x] Прогнать совместимость: `npx expo-doctor` → `npx expo install --fix`
        (выполнено; зафиксированы известные предупреждения) - Иконка приложения
        не квадратная — оставляем как есть, заказчик предоставит новый файл
        позже (см. пункт выше) - non-CNG предупреждение: проект с нативными
        папками — убедиться, что сборка выполняется через Prebuild/EAS (будет
        учтено на этапе EAS) - React Native Directory: пакеты `buffer`,
        `process`, `uuid` без метаданных — безопасно игнорируем или добавим
        исключения в `package.json` при необходимости - Проверка соответствия
        версий пакетов: transient network error; `expo install --fix` показал
        "Dependencies are up to date"
  - [x] Временная сборка на Personal Team — не актуально (есть Apple Developer);
        диплинки по схеме `bixirun://` можно не использовать
  - [ ] Universal Links для карточек — ОТЛОЖЕНО ПОСЛЕ 1.0 (не блокер) - Добавить
        позже в `app.json`: `ios.associatedDomains: ["applinks:bixirun.com"]` -
        Выложить AASA‑файлы с `TEAMID` и `com.bixirun.app` на
        `/.well-known/apple-app-site-association` и
        `/apple-app-site-association` - Выполнить `npx expo prebuild -p ios` и
        пересобрать проект в Xcode - Проверить открытие
        `https://bixirun.com/...` → приложение и обновить документацию
  - [x] `app.json`: выставить `expo.version`, инкрементировать
        `ios.buildNumber`; если AASA для `bixirun.com` не настроен — временно
        убрать `ios.associatedDomains`; убедиться, что есть
        `NSPhotoLibraryAddUsageDescription`
  - [x] Иконка приложения: обновлена на `assets/images/app-icon-ios.png` (PNG
        1024x1024, без альфы); `expo.icon` и `ios.icon` настроены.
        Предупреждение `expo-doctor` по иконке закрыто.
  - [x] EAS: добавлен prod‑профиль сборки (`eas.json`)
  - [x] Завести EAS Secrets для
        `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` (созданы в
        проекте `@bixirun/BIXIRUN`)
  - [x] TestFlight: билд + сабмит (билд 1.0.1 (2) во внутренней группе Internal,
        2 тестировщика; Encryption: Exempt)
  - [x] Bundle ID: переключено на `com.bixirun.app` (Xcode/`app.json`)
  - [x] Build Number: подготовлен следующий билд `3` (инкремент в `app.json`)
  - [x] Xcode/релиз: Supabase ключи вынесены в `app.json → expo.extra`;
        `supabaseClient.ts` читает через `expo-constants` с fallback на
        `process.env`
- [ ] UX/поведение
  - [x] Глобально отключить route‑анимации: `animation: 'none'` в
        `app/_layout.tsx`
  - [x] `FooterNavigation`: добавлены a11y атрибуты и текстовые лейблы;
        навигация — `router.replace` для мгновенного отклика
  - [x] Таймер: шумные `console.log` завернуты под `if (__DEV__)`
  - [x] Главный экран: FlatList оптимизирован (`useFlatListOptimization`),
        отложен старт загрузок через `InteractionManager`, `OptimizedImage`
        получает фиксированные размеры
  - [x] Навигация: детальные экраны открываются через `router.push` (история не
        теряется), back ведёт в блог/каталог
  - [x] Таббар: рендерится из `AppLayout`; скрыт на `/checkout` и
        `/timerWorkout`, виден на `/timer` и `/timer-settings`
  - [ ] Предзагрузка экранов — отложено, реализуем альтернативно (кеш
        данных/ленивая инициализация) без `prefetchURL`

#### Текущие метрики (DEV, по логам)

- Навигация между основными табами: 70–150 ms (отлично/хорошо)
- Фильтры каталога (первый кадр): 95–170 ms (хорошо)

#### Следующие оптимизации (по желанию)

- Каталог: обернуть `dispatch(setFilter(...))` в `startTransition` (React 19)
  для ещё более мягкого UI
- Списки: рассмотреть `windowSize: 3` на слабых устройствах для меньшего
  памяти/CPU
- Изображения: для карточек с известными размерами всегда прокидывать
  `width/height` в `OptimizedImage`
- Построение: релизная сборка (Hermes, minify) — проверка реальных метрик на
  девайсе
- [ ] App Store/ревью
  - [x] Скриншоты:
    - [x] iPhone 6.5 (портрет, JPG 1242×2688)
    - [x] iPad Pro 12.9 (портрет, JPG 2048×2732)
    - [ ] iPhone 6.7 (опционально, после 1.0)
    - [ ] iPhone 5.5 (опционально, после 1.0)
  - [ ] Описание/ключевые слова/категория
  - [x] Возрастной рейтинг (4+)
  - [x] Экспортный комплаенс: Encryption → Exempt (заполнено на билде 1.0.1 (2))
  - [x] App Privacy (таблицы ASC): - Контактные данные → Имя, Email (связаны,
        без отслеживания; цель — функциональность/аккаунт) - Идентификаторы →
        User ID (связан, без отслеживания) - Пользовательский контент →
        Фото/видео (аватар; связан, без отслеживания)
  - [ ] Privacy Policy URL и Support URL (bixirun.com/privacy,
        bixirun.com/terms, support@bixirun.com)
  - [x] Notes для ревью: нет платежей в 1.0 (checkout заглушен); авторизация не
        обязательна; рекламы/трекеров нет; медиа (аватар) в Supabase Storage

### Сделано для сабмита 1.0.1 (ASC)

- DSA (Digital Services Act): статус Not a trader принят; предупреждения сняты.
- App Privacy заполнена согласно текущему сбору данных (см. чек выше).
- Скриншоты загружены:
  - iPhone 6.5 — JPG 1242×2688 (замена PNG на JPG из‑за залипания загрузки в
    ASC).
  - iPad Pro 12.9 — JPG 2048×2732 (сконвертирован и обрезан централизованно).
- Возрастной рейтинг — 4+.
- Encryption — Exempt (указано на билде 1.0.1 (2)).
- Notes для ревью добавлены (для команды ревьюеров Apple): «В версии 1.0 нет
  платежей/IAP. Экран оплаты показывает только детали заказа; оплата отключена.
  Авторизация опциональна — основные экраны доступны без логина. Отслеживания и
  сторонней рекламы нет. Медиа (аватар) хранится в Supabase Storage. Экспорт
  шифрования — Exempt.»

Статус: версия 1.0.1 подготовлена к отправке на ревью (проверка и публикация ещё
не завершены).

- [ ] Ручной смоук‑QA (30–60 мин)
  - [ ] Холодный старт/навигация, пермишены камеры/микрофона
  - [ ] Списки/деталь товара, таймер, запись/сохранение (если используется)
  - [ ] Потеря сети/Supabase: дружелюбные ошибки/тосты; отсутствие крэшей

### Дополнительно (Legal/Privacy, сеть)

- [ ] Удаление аккаунта (Guideline 5.1.1(v)) — серверный API `DELETE /account`,
      logout и обновление политики (сроки/ретенция)
- [ ] Все внешние запросы по HTTPS (ATS ок)
- [ ] Universal Links (позже, не блокер 1.0): добавить в `app.json`
      `ios.associatedDomains: ["applinks:bixirun.com"]`, выложить AASA‑файлы с
      `TEAMID` и `com.bixirun.app` на `/.well-known/apple-app-site-association`
      и `/apple-app-site-association`

### A. Платежи YooKassa/SBP/Card (Backend: Supabase Edge)

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] Создать таблицы БД: `orders`, `order_items`, `payments`, `webhook_events`
      (+ индексы, FK, идемпотентность)
- [ ] Edge Function `POST /payments/create` (валидация корзины, расчёт суммы,
      `confirmation: { type: 'redirect', return_url }`, чеки 54‑ФЗ)
- [ ] Edge Function `POST /payments/webhook` (events:
      `payment.succeeded|canceled|waiting_for_capture`, идемпотентность по
      `event_id`)
- [ ] Секреты: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`,
      `YOOKASSA_WEBHOOK_SECRET` (только на сервере)
- [ ] Deeplink `bixirun://yookassa-return` — парсинг результата, обновление
      заказа, UI «успех/ошибка»

### B. Клиентская интеграция Checkout

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] Заменить мок‑вызовы на реальные `payments/create`
- [ ] Состояния UI: лоадеры/ошибки/повтор/смена метода, блокировка кнопок
- [ ] Локализация RU/EN (опционально)

### C. QA платежей

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] E2E сценарии: карта, СБП, 3‑DS, возврат по deeplink, отмена/ретраи
- [ ] Нагрузочный smoke на сумме/корзине/валютах (если актуально)

### D. Наблюдаемость и логи

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] Подключить Sentry/Crashlytics
- [ ] События checkout: выбор метода, «Оплатить», успех/неуспех,
      deeplink‑возврат
- [ ] Лог ошибок c корреляцией `order_id`/`payment_id`

### E. Тесты и CI/CD

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] Unit: редьюсеры/утилиты (Jest)
- [ ] E2E: Detox сценарии checkout
- [ ] EAS/fastlane: сборки, подписи, TestFlight

### F. UI/UX полиш (не блокер релиза)

— ОТЛОЖИТЬ ПОСЛЕ 1.0

- [ ] Skeleton на список/деталь товара
- [ ] Базовые Lottie‑анимации промо/переходов
- [ ] А11y: контрасты/ролями/фокус

## План внедрения платежей (по шагам)

1. Миграции БД (`orders/order_items/payments/webhook_events`, индексы, FK,
   идемпотентность)
2. Edge `POST /payments/create` (валидация, YooKassa `/payments`,
   `confirmation_url`, `Idempotence-Key`) — вернуть
   `{ confirmation_url, payment_id }`
3. Edge `POST /payments/webhook` (проверка подписи, идемпотентность, апдейт
   статусов)
4. Клиент: вызов `create`, переход по `confirmation_url`, обработка
   `return_url`/deeplink
5. UI состояния + «Повторить оплату»
6. QA e2e (карта/СБП/3‑DS), логи/аналитика, TestFlight

## Acceptance Criteria (релиз iOS)

### Для версии 1.0 (без платежей)

- Приложение стабильно стартует (без крэшей) на релизной сборке, базовая
  навигация и основные экраны работают
- Камера/микрофон/медиатека запрашиваются и используются корректно, тексты
  пермишенов соответствуют функциональности
- Таймер работает предсказуемо, UI не проседает, нет лишнего логирования в
  продакшене
- EAS/TestFlight сборка успешна; App Store метаданные/приватность заполнены; в
  заметках к ревью указано отсутствие платежей

### Для версии с платежами (последующий релиз)

- Пользователь может оплатить заказ картой/СБП → возвращается в приложение с
  корректным статусом
- Заказ и платеж корректно создаются/обновляются в БД; вебхуки идемпотентны
- Ошибки логируются и видимы в Sentry/Crashlytics; есть базовая событийная
  аналитика
- Сборка проходит EAS/TestFlight; App Store метаданные и privacy заполнены

## Быстрые ссылки

- Платежи (клиент): `app/checkout.tsx`
- Конфиг/схема: `app.json`, `supabaseClient.ts`,
  `docs/implementation/PAYMENTS_CHECKOUT.md`
- Нативка iOS: `ios/BIXIRUN/TimerVideoRecorder.swift`,
  `types/TimerVideoRecorder.d.ts`
- Каталог: `app/products.tsx`, `components/ui/*`, `docs/catalog/*`
