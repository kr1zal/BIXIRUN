## Экран «Настройки таймера» (`/timer-settings`)

Этот документ описывает архитектуру, состав и взаимодействие компонентов экрана
настройки таймера. Экран является единственной точкой конфигурации интервального
таймера и источником валидированных данных для экрана тренировки.

### Роль и место в потоке

- **Путь**: `/timer-settings`
- **Поток навигации**: `/timer → /timer-settings → /timerWorkout`
- **Ответственность**:
  - Управление параметрами таймера (время подготовка/работа/отдых, циклы, сеты,
    отдых между сетами, описания).
  - Работа с пресетами (создание/выбор/удаление/синхронизация с облаком).
  - Автосохранение последних использованных настроек в локальное хранилище.
  - Переход к экрану тренировки с передачей параметров.

### Ключевые файлы

- `app/timer-settings.tsx` — экран настроек: бизнес-логика UI, интеграция со
  стором и хранилищами.
- `components/timer/ParamRow.tsx` — строка параметра: инкремент/декремент, ввод
  описания.
- `components/timer/TimerPresetSelector.tsx` — управление пресетами: список,
  сохранение, удаление, синхронизация.
- `store/slices/timerSlice.ts` — Redux slice таймера: состояние, редьюсеры,
  переходы фаз, установка конфигурации.
- `utils/timerStorage.ts` — локальное хранилище и синхронизация с Supabase:
  загрузка/сохранение пресетов, автосейв последних настроек, merge-логика.
- `supabaseClient.ts` — функции доступа к Supabase (аутентификация и операции
  над пресетами).
- `hooks/useTimer.ts` — селекторы и производные значения для экрана тренировки
  (косвенно связан).

### Архитектура состояния

- **Единый источник истины** — `timerSlice` в Redux Toolkit.
- **Состав `TimerState` (релевантно экрану настроек)**:
  - Параметры: `prep`, `work`, `rest`, `cycles`, `sets`, `restBetweenSets`,
    `descWork`, `descRest`.
  - Служебные поля выполнения (используются на тренировке): `phase`,
    `currentCycle`, `currentSet`, `seconds`, `isFinished`, `totalCycles`,
    `totalSets`, `running`.
- **Действия, используемые экраном**: `setPrep`, `setWork`, `setRest`,
  `setCycles`, `setSets`, `setRestBetweenSets`, `setDescWork`, `setDescRest`,
  `setTimerConfig`.
- **Принципы**:
  - Мгновенное применение значений в стор (контролируемый UI).
  - Сброс таймера при полном изменении конфигурации через `setTimerConfig`.

### Экран `app/timer-settings.tsx`

- **Селекторы/диспетчер**: `useAppSelector((s) => s.timer)`, `useAppDispatch()`.
- **Навигация**: `router.push('/timerWorkout', params)` (expo-router
  `Stack.Screen` для заголовка).
- **Автосейв**: эффект, сохраняющий «последние использованные настройки» в
  AsyncStorage через `saveLastUsedTimerSettings` при каждом изменении
  параметров, но только когда `!timer.running && timer.phase === 'prep'`.
- **Пресеты**:
  - Загрузка при монтировании: `loadTimerPresets()`.
  - Выбор: массовые `dispatch(setX(...))` из выбранного пресета.
  - Создание: `addTimerPreset`, ID локально — `Date.now().toString()`; при
    удачном бэкенде обновляется на id Supabase.
  - Удаление: `deleteTimerPreset`.
  - Принудительная синхронизация: `forceSyncWithCloud(true)`; при отсутствии
    сессии — предложение перейти в `/profile`.
- **UI**:
  - Блок пресетов (`TimerPresetSelector`).
  - Секции параметров (`ParamRow`) для всех числовых значений и для описаний
    работа/отдых.
  - Переключатель авто-режима удалён из проекта.
  - Кнопка «Начать тренировку».

### Компоненты

#### `ParamRow`

- **Назначение**: единая строка для параметра с кнопками `−`/`+`, отображением
  значения и (опционально) полем описания.
- **Пропсы**:
  - `icon: string` — emoji/иконка.
  - `label: string` — подпись параметра.
  - `value: number` — текущее значение.
  - `onChange(v: number): void` — изменение значения.
  - `desc?: string`, `onDescChange?(v: string): void` — опционально для
    текстовых описаний.
  - `min?: number = 0`, `max?: number = 999` — границы.
- **UX**: кнопки изменяют значение по 1 с ограничением `min/max`; при наличии
  `onDescChange` рендерится `TextInput`.

#### `TimerPresetSelector`

- **Назначение**: управление пресетами — выбор, сохранение текущей конфигурации
  как новый пресет, удаление, ручная синхронизация.
- **Пропсы**:
  - `presets: TimerPreset[]`, `activePresetId?: string`.
  - `onSelectPreset(preset)`, `onSavePreset(preset)`, `onDeletePreset(id)`.
  - `onSyncPresets?(): Promise<void>`, `isSyncing?: boolean`.
  - `currentSettings: Omit<TimerPreset, 'id' | 'name'>` — срез текущих значений
    из стора.
- **UI**: основная кнопка с названием активного пресета; модалка со списком,
  удалением, кнопкой «Сохранить новый пресет» (вторая модалка — ввод названия).

### Хранилище и синхронизация

#### Локальные данные (AsyncStorage)

- **Модуль**: `utils/timerStorage.ts` с зависимостью от `utils/storage.ts`.
- **Объекты хранения**:
  - `TIMER_PRESETS`: массив пресетов.
  - `TIMER_LAST_SETTINGS`: последние использованные значения (без `id`/`name`).
- **Функции**:
  - `loadTimerPresets(forceRefresh?)`: учитывает кеш времени синка (5 мин), при
    отсутствии авторизации — локальные данные.
  - `saveTimerPresets(presets)`: сохраняет локально и, если пользователь
    авторизован, отправляет батч в облако.
  - `saveLastUsedTimerSettings(settings)` / `loadLastUsedTimerSettings()`.
  - CRUD пресетов: `addTimerPreset`, `deleteTimerPreset`, `updateTimerPreset`.
  - Синхронизация: `forceSyncWithCloud(force)` — merge локальных и облачных
    данных (при `force=true` приоритет у облака, иначе — по `updated_at`).

#### Облачные данные (Supabase)

- **Модуль**: `supabaseClient.ts` — `getTimerPresets`, `createTimerPreset`,
  `updateTimerPreset`, `deleteTimerPreset`, `batchSyncToCloud`, вспомогательные
  `isUserLoggedIn()` и `getCurrentUser()`.
- **Маппинги**: `convertSupabaseToAppPreset` и `convertAppToSupabasePreset`
  преобразуют поля (`rest_between_sets`, `desc_work`, `desc_rest`, и т.д.).
- **ID-стратегия**: локальный пресет получает временный `id`; при успешном
  создании в облаке `id` заменяется; также используется `local_id` для
  дедупликации.

### Навигация (expo-router)

- Заголовок экрана: `Stack.Screen` с `title: 'Настройки таймера'`.
- Переход к тренировке:
  `router.push({ pathname: '/timerWorkout', params: {...} })`.
- Таббар: видим на `/timer` и `/timer-settings`, скрыт на `/timerWorkout` (см.
  `docs/implementation/NAVIGATION.md`).

### Потоки данных

```mermaid
flowchart TD
  A[UI: ParamRow/TimerPresetSelector] --> B[Redux: timerSlice]
  B --> C[AsyncStorage: saveLastUsedTimerSettings]
  B <--> D[Preset List in state]
  D -->|save/add/delete| E[AsyncStorage: TIMER_PRESETS]
  E <--> F[Supabase: presets]
  B --> G[/timerWorkout params]
```

### UX и валидация (текущее состояние)

- Числовые параметры изменяются по 1 с ограничениями `min/max` компонента
  `ParamRow`.
- Описания (`descWork`, `descRest`) вводятся через текстовые поля в
  соответствующих строках.
- При изменении настроек в фазе `prep` и когда таймер не запущен — настройки
  автосохраняются.
- Пресеты управляются через модальные окна, удаление — без подтверждения (см.
  улучшения ниже).

### Планируемые улучшения (fine-tuning)

- **Валидация значений**: задать доменные пределы (например,
  `prep/work/rest/restBetweenSets ≥ 1` и `≤ 600`, `cycles/sets ≥ 1`).
- **UX пресетов**: подтверждение удаления; проверка уникальности имени;
  «обновить текущий пресет»; иконка/признак синхронизации и `updated_at`.
- **Автосейв**: подгружать `loadLastUsedTimerSettings()` при монтировании и
  применять через `setTimerConfig`.
- **Интеракции**: long-press автоудержание `+`/`−`; дизабл инкремента/декремента
  на границах.
- **Навигация**: не сбрасывать активный пресет при возврате с тренировки; на
  `timerWorkout` дублирующе принимать конфиг через `setTimerConfig` при
  отсутствии params.

### Сценарии и крайние случаи

- Пользователь не авторизован: синхронизация пресетов недоступна; при попытке —
  предложение пойти на `/profile`.
- Supabase недоступен: операции выполняются локально, данные будут
  синхронизированы позже.
- Быстрые изменения параметров: многократные `dispatch` и вызовы сохранения —
  безболезненно, но возможна оптимизация дебаунсом.
- Удаление активного пресета: активный `presetId` сбрасывается.

### Связанные документы

- `docs/implementation/NAVIGATION.md` — правила отображения таббара и
  маршрутизация.
- `README_TIMER_FIX.md` — обзор новой архитектуры таймера и ролей экранов.
- `docs/development/TIMER_ANALYSIS_AND_FIX.md` — детальный анализ проблем и
  решений по таймеру.

### Используемые библиотеки (Context7)

- Redux Toolkit (`/reduxjs/redux-toolkit`) — slice/редьюсеры, иммутабельные
  обновления.
- React Redux (`/reduxjs/react-redux`) — хуки `useSelector`/`useDispatch`.
- Supabase JS (`/supabase/supabase-js`) — auth и CRUD по пресетам.
- React Native Async Storage (`/react-native-async-storage/async-storage`) —
  локальное хранилище.

Примечание: навигация реализована через `expo-router`.
