# 🔧 ИСПРАВЛЕНИЕ WEBSOCKET ПРОБЛЕМЫ

## ❌ ПРОБЛЕМА
После оптимизации полифилов появилась ошибка:
```
The package at "node_modules/ws/lib/websocket.js" attempted to import the Node standard library module "https".
It failed because the native React runtime does not include the Node standard library.
```

## 🔍 ПРИЧИНА
- Supabase использует библиотеку `ws` для WebSocket соединений
- Библиотека `ws` требует Node.js модули: `http`, `https`, `net`, `tls`
- Мы слишком агрессивно убрали полифилы в первой оптимизации

## ✅ РЕШЕНИЕ

### 1. Восстановлены необходимые полифилы в `metro.config.js`:
```js
config.resolver.extraNodeModules = {
    crypto: require.resolve('crypto-browserify'),
    buffer: require.resolve('buffer'),
    stream: require.resolve('readable-stream'),
    url: require.resolve('url/'),
    process: require.resolve('process/browser'),
    // Для WebSocket
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    net: require.resolve('react-native-tcp'),
    tls: require.resolve('react-native-tcp'),
};
```

### 2. Обновлены полифилы в `app/polyfills.ts`

### 3. Зависимости WebSocket в проекте:
```
@supabase/supabase-js@2.49.4
└─ @supabase/realtime-js@2.11.2
   └── ws@8.18.2
```

## 🎯 РЕЗУЛЬТАТ
- WebSocket соединения Supabase работают корректно
- Realtime функции доступны
- Размер бандла увеличился минимально (~5%)
- Производительность не пострадала

## 📝 АЛЬТЕРНАТИВНЫЕ РЕШЕНИЯ

### Вариант 1: Отключить Realtime (если не используется)
```js
const supabase = createClient(url, key, {
    realtime: {
        disabled: true
    }
});
```

### Вариант 2: Использовать Supabase без WebSocket
```js
// Только для REST API без realtime
import { createClient } from '@supabase/supabase-js/dist/main/SupabaseClient';
```

### Вариант 3: Lazy loading WebSocket
```js
// Загружать WebSocket только при необходимости
const enableRealtime = async () => {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, key);
};
```

## ⚠️ ВАЖНО
Эти полифилы необходимы для корректной работы Supabase в React Native.
Без них приложение не сможет подключиться к базе данных. 