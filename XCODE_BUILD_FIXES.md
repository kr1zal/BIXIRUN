# 🔧 Решение ошибок сборки BIXIRUN в Xcode

## 📋 Анализ ошибок из ваших логов

Основная проблема в ваших логах - файлы не могут быть найдены во время фазы сборки скриптов. Это типичная проблема, связанная с отсутствием установленных CocoaPods зависимостей.

## 🚀 Пошаговое решение

### 1. Перенесите проект на Mac
```bash
# Клонируйте проект или скопируйте его на Mac
git clone [ваш-репозиторий]
cd bixirun
```

### 2. Запустите скрипт автоматической настройки
```bash
./setup_ios_on_mac.sh
```

### 3. Если скрипт не сработал, выполните вручную:

#### Установка зависимостей
```bash
# 1. Установите Xcode из App Store (если еще не установлен)

# 2. Установите Xcode Command Line Tools
xcode-select --install

# 3. Установите CocoaPods
sudo gem install cocoapods

# 4. Установите npm зависимости
npm install

# 5. Перейдите в iOS директорию
cd ios

# 6. Очистите старые зависимости
rm -rf Pods
rm -f Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData

# 7. Установите pod зависимости
pod install
```

### 4. Откройте проект в Xcode
```bash
# ВАЖНО: Открывайте .xcworkspace, НЕ .xcodeproj!
open BIXIRUN.xcworkspace
```

### 5. Настройте подписи в Xcode

1. Выберите проект BIXIRUN в навигаторе
2. Выберите таргет BIXIRUN
3. Перейдите на вкладку "Signing & Capabilities"
4. Включите "Automatically manage signing"
5. В поле "Team" выберите ваш Apple ID
6. Измените Bundle Identifier на уникальный (например: `com.yourname.bixirun`)

### 6. Дополнительные настройки

#### Если ошибки продолжаются:

1. **Очистите кэш сборки:**
   - В Xcode: Product → Clean Build Folder (Cmd+Shift+K)
   
2. **Проверьте настройки архитектуры:**
   - Build Settings → Architectures → Build Active Architecture Only = YES (для Debug)
   
3. **Обновите настройки проекта:**
   - В Xcode выберите проект
   - Editor → Validate Settings
   - Примените все предложенные обновления

## 🔍 Специфические ошибки из ваших логов

### Ошибка: "Build input file cannot be found"

Эти ошибки означают, что скрипты сборки не могут найти сгенерированные файлы. Решение:

1. Убедитесь, что `pod install` выполнен успешно
2. Проверьте, что открыт `.xcworkspace`, а не `.xcodeproj`
3. Выполните Clean Build Folder

### Ошибка с путями типа `/Users/kr1zai/Downloads/BIXIRUN-cursor-bc-7cc5f5ab-...`

Эти пути генерируются автоматически. После установки pods они должны исправиться.

## 📱 Запуск на устройстве

1. Подключите iPhone к Mac
2. Разблокируйте iPhone
3. В Xcode выберите ваш iPhone в списке устройств
4. Нажмите Cmd+R для сборки и запуска

### После установки на iPhone:

1. На iPhone: Настройки → Основные → VPN и управление устройством
2. Найдите профиль разработчика с вашим Apple ID
3. Нажмите "Доверять"

## ⚠️ Частые проблемы и решения

### "No matching provisioning profiles"
- Измените Bundle Identifier на уникальный
- Убедитесь, что выбран правильный Team

### "Module not found"
```bash
cd ios
pod deintegrate
pod install
```

### "Command PhaseScriptExecution failed"
```bash
cd ios
rm -rf Pods
rm Podfile.lock
pod install
```

## 🎯 Проверка успешной сборки

После успешной сборки вы должны увидеть:
- ✅ Build Succeeded
- 📱 Приложение запустится на вашем iPhone
- 🎥 Камера будет работать
- ⏱️ Таймер будет функционировать корректно

## 💡 Дополнительные советы

1. Используйте последнюю версию Xcode
2. Убедитесь, что iOS на устройстве совместима с версией в проекте
3. При первой сборке процесс может занять 5-10 минут

Если проблемы продолжаются, проверьте:
- Версию macOS (должна поддерживать текущую версию Xcode)
- Свободное место на диске (минимум 10 GB)
- Интернет-соединение (для загрузки зависимостей)