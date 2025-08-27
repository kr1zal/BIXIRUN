# Навигация и таббар (актуально)

Этот документ описывает текущую реализацию нижнего меню навигации (таббар) и
правила его использования. Состояние соответствует коду в
`components/AppLayout.tsx` и `components/FooterNavigation.tsx`.

## Состав и ответственность файлов

- `app/_layout.tsx`: корневой layout Expo Router. Внутри рендерится `Stack` и
  обёртка `AppLayout`.
- `components/AppLayout.tsx`: обёртка с провайдерами. Показывает/скрывает таббар
  на основе `pathname`.
- `components/FooterNavigation.tsx`: сам таббар — конфиг вкладок, логика
  активного таба, переходы, стили.

## Где таббар скрывается

```ts
// components/AppLayout.tsx
const hideRoutes = ["/timerWorkout", "/checkout"];
const showTabBar = !hideRoutes.some((p) => pathname.startsWith(p));
```

Добавление нового пути для скрытия — дополняем массив `hideRoutes`.

## Конфигурация вкладок

```ts
// components/FooterNavigation.tsx
const tabs = [
    { path: "/main", icon: "home", label: "Главная", fallbackPaths: ["/"] },
    { path: "/products", icon: "pricetags", label: "Каталог" },
    { path: "/timer", icon: "timer", label: "Таймер" },
    { path: "/blog", icon: "book", label: "Блог" },
    { path: "/cart", icon: "cart", label: "Корзина" },
    { path: "/profile", icon: "person-circle", label: "Профиль" },
];
```

- Активность для `'/blog'` считается только на корневом `/blog` (не на
  `/blog/[id]`).
- Переходы выполняются через `router.replace(path)` — история не разрастается.

## Визуальные параметры таббара (зафиксированные)

- Размер иконок: 24
- Цвет активной иконки: `#000`
- Цвет неактивной иконки: `#666`
- Красный (`#F33`) — только бейдж количества в корзине
- Вертикальные отступы ряда: `paddingVertical: 8`
- Нижний отступ контейнера с учётом safe-area:
  `paddingBottom: Math.max(insets.bottom - 10, 6)`

Эти параметры согласованы и используются как текущий стандарт.

## Изменение высоты белой области

Белая область «сжата» за счёт уменьшения нижнего отступа контейнера и
вертикальных отступов ряда. Размеры иконок и лейблов остаются неизменными.

## Быстрые рецепты изменений

- Скрыть таббар на экране: добавить путь в `hideRoutes`.
- Переименовать лейбл вкладки: поменять `label` в `tabs`.
- Поменять иконку: изменить `icon` в `tabs` на имя из Ionicons.
- Изменить порядок вкладок: переставить элементы `tabs`.

## Неиспользуемые вспомогательные компоненты (наследие)

- `components/HapticTab.tsx` — обёртка для кнопок RN Bottom Tabs с хаптиком. В
  текущем кастомном таббаре не используется.
- `components/ui/TabBarBackground.ios.tsx` и
  `components/ui/TabBarBackground.tsx` — фон/шим для системного таббара. Не
  используется с кастомным таббаром.
- `components/ParallaxScrollView.tsx` — использует `useBottomTabOverflow` из
  `TabBarBackground`. В самом приложении не импортируется ни одним экраном
  (проверено). Можно оставить как утилиту, либо удалить, если не планируется.

## Ссылки на код

- `app/_layout.tsx`
- `components/AppLayout.tsx`
- `components/FooterNavigation.tsx`

## Рекомендации по очистке кода

1. Если не планируется переход на `@react-navigation/bottom-tabs`, можно
   удалить:
   - `components/HapticTab.tsx`
   - `components/ui/TabBarBackground.ios.tsx`
   - `components/ui/TabBarBackground.tsx`
   - И обновить/удалить зависимости на `useBottomTabOverflow` (затронет
     `components/ParallaxScrollView.tsx`).

2. `components/ParallaxScrollView.tsx` — удалить, если не используется ни на
   одном экране; альтернативно перенести в `archive/` на случай будущего
   использования.

3. Перед удалением выполнить проектный поиск использований и убедиться в
   отсутствии импортов.

### Риски удаления

- Низкие: перечисленные файлы не подключены в текущем UI таббара.
- Потенциальное влияние: если где-то в будущих ветках планировали RN Tabs,
  потребуется восстановление этих файлов.

### Безопасное удаление (пошагово)

- Поиск по проекту: `HapticTab`, `TabBarBackground`, `useBottomTabOverflow`,
  `ParallaxScrollView`.
- Если совпадений нет (кроме самих файлов) — удаление безопасно.
- При необходимости — перенести в `docs/archive/`.
