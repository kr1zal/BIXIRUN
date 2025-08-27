> Документ архивирован. Актуальная документация по навигации и таббару:
> `docs/implementation/NAVIGATION.md`. История изменений каталога:
> `docs/catalog/CHANGELOG.md`. Полный каталог документации:
> `docs/DOCS_CATALOG.md`.

# BIXIRUN - Menu Fixed

React Native приложение с исправленной навигацией и реальными товарами на
главной странице.

## Хронология правок меню навигации

### Этап 1: Исправление базовой навигации (Июнь 2024)

**Проблема:** Меню навигации пропадало при переходах через карточки товаров и
статей.

**Решение:**

- Изменены все вызовы `router.push()` на `router.replace()` для консистентности
- Исправлена логика показа меню в `AppLayout.tsx`
- Теперь меню работает корректно на всех страницах

### Этап 2: Минимализация интерфейса (Декабрь 2024)

**Проблема:** Меню выглядело перегруженным с текстовыми подписями и
подчеркиваниями.

**Решения:**

#### 2.1 Удаление текстовых подписей

```typescript
// Убрали текстовые подписи под иконками
// Было:
<Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
    {label}
</Text>

// Стало: только иконки
<Ionicons name={icon} size={24} color={iconColor} />
```

#### 2.2 Удаление подчеркиваний

```typescript
// Убрали активные индикаторы (подчеркивания)
// Было:
{
    active && <View style={styles.activeIndicator} />;
}

// Стало: только цветовая индикация иконок
```

#### 2.3 Увеличение размера иконок

- Размер иконок увеличен с 20px до 24px для лучшей видимости
- Добавлены отступы для кнопок (`paddingHorizontal: 8, paddingVertical: 4`)

### Этап 3: Цветовая оптимизация (Декабрь 2024)

**Изменения цветовой схемы:**

#### 3.1 Переход на черно-серую схему

```typescript
// Изменили цвета с красного на черный
// Было:
color={active ? "#F33" : "#333"}

// Стало:
color={active ? "#000" : "#666"}
```

#### 3.2 Специальная индикация корзины

**Первая попытка:** Красная иконка корзины при наличии товаров

```typescript
// Специальная логика для кнопки корзины
const isCartWithItems = icon === "cart" && badge && badge > 0;
const iconColor = isCartWithItems ? "#F33" : (active ? "#000" : "#666");
```

**Финальное решение:** Только красный бейдж, иконка стандартная

```typescript
// Убрали специальную логику, оставили только красный бейдж
color={active ? "#000" : "#666"}
// Бейдж остается красным для привлечения внимания
backgroundColor: '#F33'
```

### Этап 4: Итеративные улучшения дизайна (Декабрь 2024)

**Проблема:** Пользователь запросил дополнительные изменения в дизайне меню.

**Последовательность изменений:**

#### 4.1 Запрос на изменение цвета активных иконок

**Пользователь:** "сделай иконки при выделении черным а не красным"

**Реализация:**

```typescript
// Изменили цвет активных иконок с красного на черный
<Ionicons
    name={icon}
    size={24}
    color={active ? "#000" : "#666"} // Черный для активных
/>;
```

#### 4.2 Эксперимент с красной индикацией корзины

**Пользователь:** "Кнопка карзины - когда товары добавляешь идентификация
добавления красным сделай"

**Первая реализация:**

```typescript
// Добавили специальную логику для красной корзины при наличии товаров
const TabButton = memo(({ active, icon, label, onPress, badge }) => {
    const isCartWithItems = icon === "cart" && badge && badge > 0;
    const iconColor = isCartWithItems ? "#F33" : (active ? "#000" : "#666");

    return (
        <TouchableOpacity style={styles.footerBtn} onPress={onPress}>
            <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={icon}
                        size={24}
                        color={iconColor} // Красная корзина при наличии товаров
                    />
                    {badge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {badge > 99 ? "99+" : badge}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
});
```

#### 4.3 Возврат к стандартному дизайну по просьбе пользователя

**Пользователь:** "кнопку сделай таким же стилем как и другие, красным оставь
только бэйдж"

**Финальная реализация:**

```typescript
// Убрали специальную логику для иконки корзины
const TabButton = memo(({ active, icon, label, onPress, badge }) => (
    <TouchableOpacity style={styles.footerBtn} onPress={onPress}>
        <View style={styles.tabContent}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={active ? "#000" : "#666"} // Стандартная логика для всех иконок
                />
                {badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {badge > 99 ? "99+" : badge}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    </TouchableOpacity>
));

// Бейдж остается красным
const styles = StyleSheet.create({
    badge: {
        backgroundColor: "#F33", // Только бейдж красный для привлечения внимания
        // ... остальные стили
    },
});
```

**Итоговое решение этапа 4:**

- Все иконки используют единую цветовую схему (черный/серый)
- Только бейдж корзины остается красным для индикации товаров
- Убрана специальная логика для иконки корзины
- Достигнута визуальная консистентность меню

## Исправления

### 🔧 Исправлена навигация меню

**Проблема:** Меню навигации пропадало при переходах через карточки товаров и
статей.

**Решение:**

- Изменены все вызовы `router.push()` на `router.replace()` для консистентности
- Исправлена логика показа меню в `AppLayout.tsx`
- Теперь меню работает корректно на всех страницах

### 🎨 Минимализация дизайна меню

**Что убрано:**

- Текстовые подписи под иконками
- Подчеркивания активных кнопок
- Красная цветовая схема

**Что добавлено:**

- Увеличенные иконки (24px)
- Черно-серая цветовая схема
- Красный бейдж только для корзины

### 🛍️ Реализован блок товаров на главной странице

**Что сделано:**

- Заменены заглушки (`mockProducts`) на реальные товары из Redux store
- Подключена загрузка данных через Supabase
- Добавлены состояния загрузки и обработка ошибок
- Реализовано отображение:
  - Только 1 картинка на товар (первая из массива)
  - Название товара (обрезается если длинное)
  - Цена и старая цена
  - Переход на страницу товара при нажатии

## Технологии

- React Native
- Expo Router
- Redux Toolkit
- Supabase
- TypeScript

## Структура проекта

```
app/
├── main.tsx          # Главная страница с товарами
├── products.tsx      # Каталог товаров
├── blog.tsx          # Блог
├── cart.tsx          # Корзина
└── store/            # Redux store
    ├── slices/
    │   ├── productsSlice.ts
    │   └── cartSlice.ts
    └── hooks.ts

components/
├── AppLayout.tsx     # Основной layout с навигацией
├── FooterNavigation.tsx  # Меню навигации
└── ...
```

## Установка и запуск

```bash
npm install
npm start
```

## Основные исправления в коде

### AppLayout.tsx

```typescript
// Исправлена логика показа меню
const hideTabBarRoutes = ["/timerWorkout", "/auth", "/splash"];
const showTabBar = !hideTabBarRoutes.some((route) => pathname === route);
```

### FooterNavigation.tsx (Финальная версия)

```typescript
// Минималистичный дизайн - только иконки
const TabButton = memo((
    { active, icon, label, onPress, badge }: TabButtonProps,
) => (
    <TouchableOpacity
        style={styles.footerBtn}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.tabContent}>
            <View style={styles.iconContainer}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={active ? "#000" : "#666"}
                />
                {badge
                    ? (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {badge > 99 ? "99+" : badge}
                            </Text>
                        </View>
                    )
                    : null}
            </View>
        </View>
    </TouchableOpacity>
));

// Стили без лишних элементов
const styles = StyleSheet.create({
    footerBtn: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    badge: {
        backgroundColor: "#F33", // Только бейдж красный
        // ... остальные стили
    },
});
```

### Навигация

```typescript
// Везде используется router.replace() вместо router.push()
const handleProductPress = (id: string) => {
    router.replace(`/product/${id}`);
};
```

### main.tsx

```typescript
// Подключен Redux store для реальных товаров
const { items: products, status, error } = useAppSelector((state) =>
    state.products
);

useEffect(() => {
    if (status === "idle") {
        dispatch(fetchProducts());
    }
}, [dispatch, status]);
```

## Результат

✅ Меню навигации работает стабильно на всех страницах\
✅ Минималистичный дизайн - только иконки без текста\
✅ Черно-серая цветовая схема для строгого вида\
✅ Красный бейдж корзины для привлечения внимания\
✅ Единая цветовая логика для всех иконок (без исключений)\
✅ Итеративные улучшения по обратной связи пользователя\
✅ Реальные товары загружаются на главной странице\
✅ Корректные переходы между страницами\
✅ Обработка состояний загрузки и ошибок

## Дизайн-решения

### Цветовая схема меню (Финальная версия)

- **Активная кнопка**: черная (#000) - четкая индикация текущей страницы
- **Неактивная кнопка**: серая (#666) - мягкий неактивный цвет
- **Бейдж корзины**: красный (#F33) - единственный красный элемент для
  привлечения внимания
- **Консистентность**: все иконки следуют единой логике без исключений

### Минимализм

- Убраны все текстовые подписи для чистоты интерфейса
- Убраны подчеркивания - цветовая индикация достаточна
- Увеличены иконки до 24px для лучшей видимости
- Добавлены отступы для комфортного нажатия

### Итеративный подход к дизайну

- Учтена обратная связь пользователя на каждом этапе
- Протестированы различные варианты индикации корзины
- Найден баланс между функциональностью и визуальной консистентностью
- Финальное решение основано на принципах единообразия

# BIXIRUN

Приложение для интервальных тренировок с синхронизацией пресетов таймера через
Supabase.

## Настройка Supabase

1. Создайте аккаунт на [Supabase](https://supabase.com/)
2. Создайте новый проект
3. В разделе SQL Editor выполните скрипт из файла `docs/timer_presets_table.sql`
   для создания таблицы и политик безопасности
4. Создайте файл `.env` в корне проекта со следующим содержимым:

```
# Supabase credentials
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Замените `your-supabase-url` и `your-supabase-anon-key` на значения из настроек
вашего проекта Supabase (Project Settings > API).

## Запуск проекта

1. Установите зависимости:

```
npm install
```

2. Запустите проект:

```
npm start
```

## Функциональность

### Таймер

- Настройка интервалов (подготовка, работа, отдых)
- Настройка циклов и сетов
- Сохранение и загрузка пресетов
- Синхронизация пресетов с облаком через Supabase

### Синхронизация

В приложении реализована синхронизация пресетов таймера между устройствами через
Supabase:

1. Создайте аккаунт в приложении (страница Профиль)
2. Используйте кнопку синхронизации в селекторе пресетов
3. Войдите в свой аккаунт на другом устройстве для доступа к тем же пресетам

## Техническая информация

Проект разработан с использованием:

- React Native и Expo
- Redux для управления состоянием
- Supabase для бэкенда и аутентификации
- AsyncStorage для локального хранения данных

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with
[`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app
  development with Expo

You can start developing by editing the files inside the **app** directory. This
project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and
create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following
resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into
  advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a
  step-by-step tutorial where you'll create a project that runs on Android, iOS,
  and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform
  and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask
  questions.

# BIXIRUN Cloud Synchronization

This project implements a robust cloud synchronization system using Supabase for
BIXIRUN, allowing users to work offline and sync their timer presets when
online.

## Key Features

- **Offline-first functionality**: All app features work without internet
  connection
- **Cloud synchronization**: Presets sync across devices when signed in
- **Differential synchronization**: Only changed data is transmitted to save
  bandwidth
- **Conflict resolution**: Uses timestamps to resolve conflicts when the same
  preset is changed on multiple devices

## Implementation Details

### Database Schema

The Supabase database includes these optimizations:

- `local_id` field to link local and cloud data
- `updated_at` field for tracking changes and resolving conflicts
- Unique constraints and indexes for efficient lookups
- RLS policies for secure data access

### Synchronization Logic

- **Automatic background synchronization** via SyncManager component
- **Force sync** when network reconnects or app comes to foreground
- **Intelligent batching** to reduce API calls
- **Transaction support** to ensure data integrity

## How to Use

### For Users

1. **Using without an account**: All features work locally without signing in
2. **Signing up**: Create an account to enable cloud synchronization
3. **Adding presets**: New presets are saved locally and synced when online
4. **Using offline**: Create and modify presets while offline, changes sync
   automatically when connection is restored

### For Developers

1. **SyncManager**: Controls background synchronization timing
2. **timerStorage**: Handles the logic for reading/writing timer presets with
   cloud support
3. **supabaseClient**: Contains the Supabase connection and synchronization
   implementation

## Troubleshooting

- **Sync issues**: Force sync by navigating to the timer preset screen and
  pulling to refresh
- **Duplicate presets**: If you see duplicates, this means there was a sync
  conflict. Delete the unwanted copy.

## Future Improvements

- Add support for real-time updates using Supabase Realtime
- Implement better conflict resolution with user prompts when needed
- Add sync status indicators in the UI
