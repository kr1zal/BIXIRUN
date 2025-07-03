# BIXIRUN - Каталог: Одновременная работа тапа и свайпа

Документация по реализации одновременной работы жестов тапа и свайпа для карточек товаров в каталоге.

## Проблема

На странице каталога товаров необходимо было реализовать:
- **Свайп** - для просмотра галереи изображений товара
- **Тап** - для перехода на страницу детального просмотра товара

Стандартные решения React Native не позволяют легко совместить эти жесты.

## Решение

Использован **React Native Gesture Handler** с применением паттерна `Gesture.Simultaneous` для одновременной работы жестов.

### Технические детали

#### 1. Подключение библиотеки

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
```

#### 2. Создание жестов

```typescript
// Жест тапа с ограничениями для работы со свайпом
const tapGesture = React.useMemo(() =>
    Gesture.Tap()
        .maxDuration(250)      // Быстрый тап
        .maxDistance(10)       // Небольшое движение разрешено
        .runOnJS(true)         // Выполнение на JS потоке
        .onEnd((_event, success) => {
            if (success) {
                onPress();     // Навигация к товару
            }
        })
, [onPress]);

// Жест пана для свайпа изображений
const panGesture = React.useMemo(() =>
    Gesture.Pan()
        .activeOffsetX([-10, 10])  // Активируется при горизонтальном движении
        .failOffsetY([-10, 10])    // Отменяется при вертикальном движении
, []);

// Комбинированный жест для одновременной работы
const composedGesture = React.useMemo(() =>
    Gesture.Simultaneous(tapGesture, panGesture)
, [tapGesture, panGesture]);
```

#### 3. Применение к компоненту

```typescript
<GestureDetector gesture={composedGesture}>
    <View style={styles.imageContainer}>
        {/* Галерея изображений с FlatList */}
        <FlatList
            data={item.images}
            renderItem={renderGalleryImage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            getItemLayout={getItemLayout}
            keyExtractor={(_, index) => index.toString()}
        />
        
        {/* Пагинация (точки) */}
        {renderPagination()}
    </View>
</GestureDetector>
```

### Ключевые особенности реализации

#### 1. Параметры жеста тапа
- `maxDuration(250)` - ограничивает время тапа до 250мс
- `maxDistance(10)` - позволяет небольшое движение пальца (10px)
- `runOnJS(true)` - принудительное выполнение на JS потоке для навигации

#### 2. Параметры жеста пана
- `activeOffsetX([-10, 10])` - активируется только при горизонтальном движении
- `failOffsetY([-10, 10])` - отменяется при вертикальном движении

#### 3. Навигация
```typescript
const handleCardPress = (id: string) => {
    router.replace(`/product/${id}`); // Использование replace вместо push
};
```

## Структура файлов

### app/products.tsx (Каталог)
- Основная логика каталога товаров
- Реализация одновременных жестов
- Галерея изображений с пагинацией

### Ключевые компоненты:

#### GridItem
```typescript
const GridItem = React.memo(({ item, onPress }: CardProps) => {
    // Состояние активного изображения
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);
    
    // Жесты
    const tapGesture = React.useMemo(() => /* ... */);
    const panGesture = React.useMemo(() => /* ... */);
    const composedGesture = React.useMemo(() => /* ... */);
    
    // Рендер галереи
    const renderGalleryImage = React.useCallback(/* ... */);
    
    return (
        <View style={styles.gridCard}>
            <GestureDetector gesture={composedGesture}>
                {/* Галерея изображений */}
            </GestureDetector>
            {/* Информация о товаре */}
        </View>
    );
});
```

## Результат

✅ **Свайп работает** - пользователь может листать изображения товара  
✅ **Тап работает** - пользователь может нажать на карточку для перехода к товару  
✅ **Жесты не конфликтуют** - оба жеста работают одновременно  
✅ **Меню навигации сохраняется** - использование `router.replace()`  

## Отладка

### Проблемы которые были решены:

1. **Крашы при тапе**: 
   - Добавлен `runOnJS(true)`
   - Использован `onEnd` вместо `onStart`

2. **Пропадание меню навигации**:
   - Изменен `router.push()` на `router.replace()`

3. **Конфликт жестов**:
   - Использован `Gesture.Simultaneous` вместо отдельных жестов

## Использованные технологии

- **React Native Gesture Handler** - для управления жестами
- **Context7** - для получения актуальной документации
- **Redux Toolkit** - для управления состоянием
- **Expo Router** - для навигации

## Команды для проверки

```bash
# Проверка типов
npx tsc --noEmit

# Запуск приложения
npx expo start --clear
```

## Дополнительные возможности

Реализованная система жестов также поддерживает:
- Пагинацию изображений (точки внизу карточки)
- Оптимизацию производительности через `React.memo`
- Обработку состояний загрузки
- Адаптивную верстку для разных размеров экрана 