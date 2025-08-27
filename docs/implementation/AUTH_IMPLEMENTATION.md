# Глобальная система аутентификации

## Обзор

Реализована глобальная система проверки сессии пользователя с использованием Supabase Auth и React Context API. Система автоматически отслеживает состояние аутентификации пользователя во всем приложении.

## Исправления

### ✅ Исправлена конфигурация Supabase Client (`app/supabaseClient.ts`)

**Проблема:** Supabase клиент не был настроен для сохранения сессий в React Native.

**Решение:**
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,           // ✅ Сохранение сессий
        autoRefreshToken: true,          // ✅ Автообновление токенов
        persistSession: true,            // ✅ Персистентные сессии
        detectSessionInUrl: false,       // ✅ Отключено для мобильных
    },
});

// ✅ Автообновление при активации приложения
AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
```

### ✅ Исправлены импорты компонентов

**Проблема:** Использовались алиасы `@/` которые могли не работать при hot reload.

**Исправлено:**
- `components/AuthProvider.tsx`: `@/app/supabaseClient` → `../app/supabaseClient`
- `app/auth.tsx`: `@/components/AuthProvider` → `../components/AuthProvider`
- `app/profile.tsx`: `@/components/AuthProvider` → `../components/AuthProvider`
- `hooks/useAuthRedirect.ts`: `@/components/AuthProvider` → `../components/AuthProvider`

## Компоненты

### 1. AuthProvider (`components/AuthProvider.tsx`)

Главный провайдер контекста аутентификации:

- **Функции:**
  - Автоматическая проверка сессии при запуске приложения
  - Отслеживание изменений состояния аутентификации
  - Глобальное управление состоянием пользователя
  - Централизованная функция выхода из системы

- **Состояние:**
  - `session`: текущая сессия пользователя
  - `user`: данные пользователя
  - `loading`: состояние загрузки
  - `signOut`: функция выхода

### 2. ProtectedRoute (`components/ProtectedRoute.tsx`)

Компонент для защиты роутов:
- Автоматический редирект неавторизованных пользователей
- Показ загрузки во время проверки сессии

### 3. useAuthRedirect (`hooks/useAuthRedirect.ts`)

Хук для гибкого управления редиректами:
- `requireAuth`: требует авторизацию
- `redirectTo`: куда редиректить неавторизованных
- `redirectIfAuth`: куда редиректить авторизованных

## Интеграция

### AppLayout.tsx
```typescript
import { AuthProvider } from './AuthProvider';

export const AppLayout = memo(({ children }: AppLayoutProps) => {
    return (
        <Provider store={store}>
            <AuthProvider>  {/* ✅ Глобальный провайдер */}
                <GestureHandlerRootView style={{ flex: 1 }}>
                    {/* остальной код */}
                </GestureHandlerRootView>
            </AuthProvider>
        </Provider>
    );
});
```

### Использование в компонентах
```typescript
import { useAuth } from '../components/AuthProvider';

const MyComponent = () => {
    const { user, loading, signOut } = useAuth();
    
    if (loading) return <LoadingSpinner />;
    if (!user) return <LoginPrompt />;
    
    return <AuthenticatedContent />;
};
```

## Решение проблемы "вылетания" сессии

### До исправления:
- ❌ Сессии не сохранялись между перезапусками
- ❌ Токены не обновлялись автоматически
- ❌ При hot reload сессия терялась

### После исправления:
- ✅ Сессии сохраняются в AsyncStorage
- ✅ Токены автоматически обновляются
- ✅ При hot reload сессия восстанавливается
- ✅ При возвращении в приложение сессия обновляется

## Тестирование

1. **Авторизуйся в приложении**
2. **Сделай hot reload (`r` в терминале)**
3. **Проверь, что сессия сохранилась**
4. **Закрой и открой приложение**
5. **Проверь, что не нужно логиниться заново**

## Зависимости

Убедись, что установлены:
```bash
npm install @react-native-async-storage/async-storage
npm install react-native-url-polyfill
```

## Отладка

Для отладки добавь логи в AuthProvider:
```typescript
console.log('Auth state changed:', event, session?.user?.id);
```

Проверь в консоли:
- Загружается ли начальная сессия
- Срабатывает ли `onAuthStateChange`
- Сохраняется ли сессия в AsyncStorage

## Преимущества новой системы

1. **Глобальная проверка сессии** - проверяется один раз при запуске приложения
2. **Автоматическое обновление UI** - все компоненты автоматически реагируют на изменения состояния аутентификации
3. **Централизованное управление** - вся логика аутентификации в одном месте
4. **Предотвращение "вылетания" аккаунта** - сессия отслеживается глобально
5. **Упрощенная разработка** - не нужно дублировать логику проверки в каждом компоненте

## Рекомендации

1. Используйте `useAuth()` вместо прямых вызовов Supabase в компонентах
2. Для защищенных роутов используйте `ProtectedRoute` или `useAuthRedirect`
3. Не дублируйте логику проверки сессии - полагайтесь на AuthProvider
4. При необходимости кастомной логики аутентификации расширяйте AuthProvider

## Тестирование

Для тестирования системы:

1. Войдите в аккаунт
2. Закройте и откройте приложение - сессия должна сохраниться
3. Выйдите из аккаунта - должен произойти редирект на страницу авторизации
4. Попробуйте зайти на защищенные страницы без авторизации 