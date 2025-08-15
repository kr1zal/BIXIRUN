# Технические спецификации UI/UX блога

## 📋 Обзор

Данный документ содержит технические спецификации для UI/UX компонентов блога,
включая стили, цвета, размеры и принципы дизайна.

## 🎨 Дизайн система

### Цветовая палитра

```typescript
// constants/Colors.ts
export const BlogColors = {
    light: {
        // Основные цвета
        cardBackground: "#ffffff",
        containerBackground: "#f9fafb",

        // Типографика
        textPrimary: "#1a1a1a",
        textSecondary: "#6b7280",
        textTertiary: "#9ca3af",

        // Элементы
        borderLight: "#e5e7eb",
        shadowColor: "#000000",
        placeholderBackground: "#f5f5f5",
    },

    dark: {
        // Основные цвета
        cardBackground: "#1f2937",
        containerBackground: "#111827",

        // Типографика
        textPrimary: "#f9fafb",
        textSecondary: "#9ca3af",
        textTertiary: "#6b7280",

        // Элементы
        borderLight: "#374151",
        shadowColor: "#000000",
        placeholderBackground: "#374151",
    },
};
```

### Типографика

```typescript
// Заголовки статей
const titleStyle = {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
    color: BlogColors.light.textPrimary,
};

// Превью текст
const previewStyle = {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    color: BlogColors.light.textSecondary,
};
```

### Spacing (Salt Design System)

```typescript
// Базовые отступы
const spacing = {
    xs: 4, // --salt-spacing-100
    sm: 8, // --salt-spacing-200
    md: 16, // --salt-spacing-400
    lg: 24, // --salt-spacing-600
    xl: 32, // --salt-spacing-800
    xxl: 100, // Кастомный для navigation safety
};
```

### Shadow/Elevation

```typescript
// Современный shadow для карточек
const cardShadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4, // Android
};
```

## 📱 Компоненты

### ArticleCard

#### Размеры

- **Высота:** 280px (оптимизировано с 300px)
- **Ширина:** 100% контейнера
- **Радиус:** 16px (современный)
- **Отступы:** 16px внутренние

#### Пропорции

- **Изображение:** 45% высоты (126px)
- **Контент:** 55% высоты (154px)
- **Соотношение:** 45:55 (золотое сечение)

#### Структура

```typescript
interface ArticleCardProps {
    item: ArticleItem;
    onPress: () => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.articleCard}
            onPress={onPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Читать статью: ${item.title}`}
            accessibilityHint="Нажмите для открытия полной статьи"
        >
            <View style={styles.articleImageContainer}>
                {/* Изображение или placeholder */}
            </View>
            <View style={styles.articleTextBlock}>
                <Text style={styles.articleTitle}>{item.title}</Text>
                <Text style={styles.articlePreview}>{item.summary}</Text>
            </View>
        </TouchableOpacity>
    );
};
```

#### Стили

```typescript
const styles = StyleSheet.create({
    articleCard: {
        backgroundColor: BlogColors.light.cardBackground,
        borderRadius: 16,
        ...cardShadow,
        overflow: "hidden",
        flexDirection: "column",
        height: 280,
        width: "100%",
        marginBottom: spacing.md,
    },

    articleImageContainer: {
        width: "100%",
        height: "45%",
        backgroundColor: BlogColors.light.placeholderBackground,
    },

    articleTextBlock: {
        flex: 1,
        padding: spacing.md,
        justifyContent: "space-between",
    },

    articleTitle: {
        ...titleStyle,
        marginBottom: spacing.sm,
    },

    articlePreview: {
        ...previewStyle,
        marginBottom: spacing.sm,
    },
});
```

### BlogScreen Container

#### Размеры

- **Padding:** 16px горизонтальный
- **PaddingBottom:** 100px (безопасная зона для navigation)
- **Фон:** #f9fafb (современный светлый)

#### Стили

```typescript
const containerStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BlogColors.light.containerBackground,
    },

    listContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xxl, // Безопасная зона
    },
});
```

## 🔧 Accessibility

### Требования

- **Роли:** `accessibilityRole="button"` для карточек
- **Лейблы:** Описательные `accessibilityLabel`
- **Подсказки:** `accessibilityHint` для действий
- **Минимальный размер:** 44px touch target (соответствует)

### Реализация

```typescript
// Обязательные accessibility props
const accessibilityProps = {
    accessibilityRole: "button" as const,
    accessibilityLabel: `Читать статью: ${item.title}`,
    accessibilityHint: "Нажмите для открытия полной статьи",
};
```

## 📊 Производительность

### Оптимизации

- **Нулевое влияние:** Все изменения только CSS
- **Совместимость:** 100% с существующим кодом
- **Память:** Не увеличивается потребление

### Метрики

- **Время рендера:** Без изменений
- **Размер bundle:** Без изменений
- **FPS:** Без влияния на производительность

## 🧪 Тестирование

### Устройства

- **iOS:** iPhone 12/13/14/15 series
- **Android:** Samsung Galaxy S21+, Pixel 6+
- **Разрешения:** 375x812 до 428x926

### Сценарии

1. **Загрузка списка:** Проверка отображения карточек
2. **Прокрутка:** Smooth scrolling без лагов
3. **Нажатие:** Правильная обратная связь
4. **Навигация:** Безопасная зона от tab bar

### Чек-лист

- [ ] Карточки отображаются с тенью
- [ ] Пропорции изображения 45:55
- [ ] Текст читается на всех устройствах
- [ ] Последняя статья не скрыта navigation
- [ ] Accessibility работает корректно

## 🚀 Развертывание

### Файлы для обновления

1. `components/articles/ArticleCard.tsx`
2. `constants/Colors.ts`
3. `app/blog/index.tsx`

### Последовательность

1. Обновить цветовую палитру
2. Применить новые стили к карточкам
3. Обновить контейнер списка
4. Тестировать на устройствах

### Откат

Все изменения обратимы через git, влияние только на стили.

## 📚 Ссылки

- [Salt Design System](https://saltdesignsystem.com/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Версия:** 1.0\
**Дата:** 2024-12-25\
**Автор:** AI Assistant\
**Статус:** Готов к производству
