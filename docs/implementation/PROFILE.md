# PROFILE.md — Страница профиля

Последнее обновление: 2025-08-21

---

## Назначение

Единая спецификация экрана профиля: архитектура, зависимости, UX-потоки,
интеграции с Supabase, а также сводный чек-лист задач по профилю.

---

## Размещение в проекте и навигация

- Файл экрана: `app/profile.tsx`
- Нижнее меню: кастомный `components/FooterNavigation.tsx` (Tabs не
  используются)
- Переходы внутри экрана: `expo-router` (`useRouter().replace('/cart')` и т.п.)

---

## Обязанности экрана

- Авторизация и регистрация (email/password) через Supabase
- Выход из аккаунта
- Отображение данных пользователя: email, имя (`user.user_metadata.name`),
  аватар (`user.user_metadata.avatar_url`)
- Загрузка/смена аватара в Supabase Storage (`avatars`), обновление метаданных
  пользователя
- Редактирование имени профиля (`supabase.auth.updateUser({ data: { name } })`)
- Синхронизация пресетов таймера с облаком (кнопка → `forceSyncWithCloud(true)`)
- Биометрическая аутентификация (заглушка: проверка и системный промпт, без
  реального связывания сессии)
- Google Auth (заглушка: алерт вместо реальной интеграции)
- Счётчик товаров в корзине (Redux) и быстрые действия
- Превью «недавних товаров» (берутся первые 4 из Redux `state.products.items`)

---

## Зависимости

- UI/Expo/React Native:
  - `expo-router` (`Stack`, `useRouter`)
  - `react-native-safe-area-context` (`SafeAreaView`)
  - `@expo/vector-icons` (`Ionicons`)
  - `react-native` (базовые компоненты)
  - `components/ui/OptimizedImage.tsx` — для аватара
- State:
  - Redux: `useSelector`, `selectCartItemsCount`, `RootState`
- Auth/Storage/Sync:
  - `supabaseClient.ts` → `supabase`, `signIn`, `signUp`
  - `utils/timerStorage.ts` → `forceSyncWithCloud`
  - `buffer` (`Buffer.from` для base64 → бинарные данные при аплоаде)
- Пермишены/устройства:
  - `expo-image-picker` — выбор изображения для аватара
  - `expo-local-authentication` — проверка HW/биометрии и системный промпт

---

## Архитектура и состояние

- Локальное состояние: `email`, `password`, `username`, `displayName`,
  `profileImage`, `mode` (`'login' | 'register'`), `loading`, `syncing`,
  `showPassword`, `isEditingName`, `isBiometricSupported`
- Авторизация: `useAuth()` из `components/AuthProvider` →
  `{ session, user, loading: authLoading, signOut }`
- Рендер по состоянию:
  - Пока `authLoading` — индикатор «Проверка сессии…»
  - Если `user` есть — UI профиля (аватар, имя, email, действия)
  - Если `user` нет — формы входа/регистрации с переключателем режима

---

## UX-потоки (основные сценарии)

1. Вход (email/password)

- Валидация на пустые поля → `signIn(email, password)` → сброс `password` →
  обработка ошибок через `Alert`

2. Регистрация (email/password/username)

- Валидация на заполнение → `signUp(email, password)` → сброс `password` →
  ошибки через `Alert`

3. Выход

- `authSignOut()` из `useAuth()` → `Alert` об успехе

4. Смена аватара

- `expo-image-picker.launchImageLibraryAsync({ base64: true, aspect: [1,1], quality: 0.8 })`
- Временная установка локального `imageUri` для мгновенного UI-отклика
- Генерация пути в `avatars` бакете: `${user.id}/${Date.now()}.jpg`
- Конвертация `base64` → `Buffer.from(base64, 'base64')`
- `supabase.storage.from('avatars').upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })`
- Публичный URL: `supabase.storage.from('avatars').getPublicUrl(filePath)`
- Обновление метаданных пользователя:
  `supabase.auth.updateUser({ data: { avatar_url: publicUrl } })`
- Обновление локального `profileImage` → уведомление
- При ошибке: алерт и откат к `user.user_metadata.avatar_url`

5. Изменение имени

- `supabase.auth.updateUser({ data: { name: displayName } })` → успех/ошибки
  через `Alert`, закрыть режим редактирования

6. Синхронизация пресетов таймера

- Требует `user` (иначе алерт)
- `setSyncing(true)` → `forceSyncWithCloud(true)` → алерт с количеством
  синхронизированных пресетов → `setSyncing(false)`

7. Биометрическая аутентификация (заглушка)

- Проверка HW: `LocalAuthentication.hasHardwareAsync()` (в `useEffect`)
- Проверка, что биометрия настроена: `LocalAuthentication.isEnrolledAsync()`
- Вызов
  `LocalAuthentication.authenticateAsync({ promptMessage, disableDeviceFallback: true })`
- При успехе — только уведомление (реального связывания сессии нет)

8. Google Auth (заглушка)

- Кнопка вызывает `handleGoogleAuth()` → алерт «not implemented yet»

---

## Обработка ошибок и UX

- Все ключевые операции обёрнуты в `try/catch` с `Alert`
- Прогресс-индикаторы: `loading`, `syncing`, `authLoading`
- Оптимистичный апдейт при смене аватара (мгновенный превью перед аплоадом)

---

## Безопасность и пермишены

- Supabase RLS/политики для бакета `avatars` должны быть настроены (см.
  `TECH_SPEC.md: Supabase Storage Setup`)
- Проверка аппаратной поддержки и факта настройки биометрии перед вызовом
  системного промпта
- Никогда не пытаться аплоадить аватар без `user.id`

---

## Производительность

- Отрисовка аватара через `OptimizedImage` (кэширование изображений)
- Избегать лишних ререндеров форм и списков; при необходимости мемоизировать
  обработчики
- Превью «недавних товаров» ограничено первыми 4 элементами

---

## Связанные документы

- `docs/implementation/TECH_SPEC.md` — мастер-спецификация, разделы про профиль
  и Supabase Storage
- `docs/optimization/supabase_integration.md` — краткое описание роли
  `app/profile.tsx` и синхронизации таймера
- `docs/catalog/ARCHITECTURE.md` — наличие экрана `profile.tsx` в структуре
- `docs/archive/product-cards/IMAGE_OPTIMIZATION_SOLUTION.md` — упоминание про
  оптимизацию изображений в профиле

---

## Сводный чек-лист задач (Profile)

Готово:

- [x] Экран `ProfileScreen` (`app/profile.tsx`)
- [x] Отображение профиля, аватар, имя, email
- [x] Загрузка/смена аватара в Supabase Storage (`avatars`)
- [x] Изменение имени профиля (`supabase.auth.updateUser`)
- [x] Кнопка синхронизации пресетов таймера (`forceSyncWithCloud(true)`) и
      уведомление о количестве
- [x] Биометрия — заглушка (HW/enrolled check + системный промпт)

Открытые задачи (из TECH_SPEC + консолидация):

- [ ] История заказов на экране профиля (привязка к `orders`),
      UI/пагинация/скелетоны
- [ ] Методы оплаты (UI, привязка к бэкенду; Apple Pay/Google Pay — план)
- [ ] Реальная интеграция Google Auth (OAuth + связывание сессии Supabase)
- [ ] Интеграция биометрии с реальным логином (secure storage токенов/refresh,
      fallback)
- [ ] Улучшение UX загрузки аватара (progress, retry, размер/ограничения)
- [ ] Единые плейсхолдеры и обработка ошибок по всему экрану (включая превью
      товаров)
- [ ] Тесты (unit/E2E) на ключевые потоки: вход/регистрация/выход, смена
      аватара, sync пресетов

Зависимые/смежные задачи (не напрямую внутри профиля, но связаны по UX):

- [ ] Checkout/оформление заказа (экран `app/checkout.tsx`) — для наполнения
      истории заказов
- [ ] Серверные функции/миграции для заказов и платежей (Supabase)

---

## Быстрые заметки по реализации

- При загрузке аватара используйте `upsert: true`, чтобы повторная загрузка
  обновляла файл
- Публичные URL из Supabase Storage лучше нормализовать и кэшировать
- При редактировании имени держите отдельное поле `displayName` и чёткий режим
  редактирования (`isEditingName`)
- Для «Недавних товаров» можно переходить на выделенный селектор/мемоизацию,
  если появится логика отбора

---

## Обновления (2025-08-21)

### Навигация и UX

- «Недавно просмотренные» теперь навигируют по `slug` (раньше по `id`), в
  соответствии с `app/product/[slug].tsx`.
- Миниатюры товаров в этом блоке передают размеры в `OptimizedImage`
  (`width=110`, `height=110`) для генерации уменьшенных URL.
- «Прочитанные статьи» берутся из Redux (`state.articles.items`), показываем
  первые 3, переход по `router.push('/blog/[id]')`.
- Вертикальные отступы между всеми секциями унифицированы (карточка профиля,
  статистика, секции) — ровные интервалы.
- Кнопка «Выйти» заменена на компактную «деструктивную строку» внутри секции;
  нижний спейсер рассчитывается через `useSafeAreaInsets()`, чтобы кнопка не
  уезжала под таб-бар.

#### Отступы у таббара (актуально)

- Снижен нижний отступ контента для приближения к кастомному таббару:
  - `ScrollView.contentContainerStyle.paddingBottom = Math.max(0, insets.bottom + 4)`.
  - Последняя секция (с «Выйти»): `marginBottom = 0`.
  - Нижний спейсер: `height = Math.max(0, insets.bottom + 6)`.
  - Ранее: `paddingBottom` было больше, финальные значения подобраны визуально
    для равномерной «прилипшей» компоновки без перекрытия safe‑area.

### Синхронизация пресетов

- Кнопка синхронизации на профиле — ручной триггер бэкапа/мержа пресетов между
  локальным хранилищем и облаком Supabase для текущего пользователя.
  Используется после офлайна, переустановки или на новом устройстве. Конфликты
  разрешаются по `(user_id, local_id)` и `updated_at`.

### Исправления Supabase

- Таблица `timer_presets` приведена к формату приложения: добавлены
  `prep, work, rest, cycles, sets, rest_between_sets, desc_work, desc_rest, updated_at, local_id`;
  `duration` сделан NULLABLE с дефолтом `0`.
- Вставка/синхронизация:
  - всегда проставляем `user_id` из `supabase.auth.getUser()`;
  - upsert выполняется с `onConflict: 'user_id,local_id'`;
  - в пакетной синхронизации поле `id` не отправляется (во избежание конфликтов
    по PK);
  - `local_id` отправляется только если это валидный UUID.
