# ✅ Чек-лист готовности iOS проекта BIXIRUN

## 📋 Перед началом работы на Mac

### Что у вас уже готово:
- ✅ React Native код написан и протестирован
- ✅ Все npm зависимости указаны в package.json
- ✅ Podfile настроен для iOS зависимостей
- ✅ Нативный модуль TimerVideoRecorder создан
- ✅ Info.plist содержит необходимые разрешения

### Что нужно сделать на Mac:

## 1️⃣ Системные требования
- [ ] macOS 12.0 или новее
- [ ] Xcode 14.0 или новее (скачать из App Store)
- [ ] Минимум 10 GB свободного места на диске
- [ ] Стабильное интернет-соединение

## 2️⃣ Установка инструментов
```bash
# Выполните эти команды в терминале на Mac
- [ ] xcode-select --install
- [ ] sudo gem install cocoapods
- [ ] brew install node (если нет Node.js)
```

## 3️⃣ Настройка проекта
```bash
# В корневой директории проекта
- [ ] npm install
- [ ] cd ios
- [ ] pod install
```

## 4️⃣ Настройка в Xcode
- [ ] Открыть ios/BIXIRUN.xcworkspace (НЕ .xcodeproj!)
- [ ] Signing & Capabilities:
  - [ ] Включить "Automatically manage signing"
  - [ ] Выбрать Team (ваш Apple ID)
  - [ ] Изменить Bundle Identifier на уникальный
- [ ] Выбрать ваш iPhone как target device

## 5️⃣ Проверка разрешений
Убедитесь, что в Info.plist есть:
- [ ] NSCameraUsageDescription
- [ ] NSMicrophoneUsageDescription  
- [ ] NSPhotoLibraryAddUsageDescription
- [ ] NSPhotoLibraryUsageDescription

## 6️⃣ Первая сборка
- [ ] Product → Clean Build Folder (Cmd+Shift+K)
- [ ] Нажать Run (Cmd+R)
- [ ] Дождаться завершения сборки (5-10 минут)

## 7️⃣ На iPhone после установки
- [ ] Настройки → Основные → VPN и управление устройством
- [ ] Доверять профилю разработчика
- [ ] Разрешить доступ к камере и микрофону при запуске

## 🚨 Если возникли проблемы

### "Build input file cannot be found"
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
```

### "No such module"
```bash
cd ios
pod deintegrate
pod install
```

### Другие ошибки сборки
1. Clean Build Folder в Xcode
2. Удалить DerivedData:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```
3. Перезапустить Xcode

## 📱 Тестирование функционала

После успешной установки проверьте:
- [ ] Приложение запускается
- [ ] Навигация работает
- [ ] Экран таймера открывается
- [ ] Камера включается
- [ ] Таймер отсчитывает время
- [ ] Видео записывается
- [ ] Видео сохраняется в галерею

## 🎯 Готово к продакшену?

Для публикации в App Store потребуется:
- [ ] Apple Developer Account ($99/год)
- [ ] Иконки приложения всех размеров
- [ ] Скриншоты для App Store
- [ ] Описание приложения
- [ ] Настройка Production сертификатов

---

💡 **Совет**: Сохраните этот чек-лист и отмечайте выполненные пункты по мере продвижения!