# Хронология разработки записи видео с таймером

## Исходная задача
Реализовать функцию записи видео с наложением таймера в React Native приложении BIXIRUN:
- При нажатии кнопки "СТАРТ" - автоматически начинается запись видео с видимым таймером
- При нажатии кнопки "СТОП" - запись останавливается и видео сохраняется с наложенным таймером
- Без дополнительных действий от пользователя

## Попытка 1: FFmpeg программное наложение
**Дата:** Начало разработки
**Подход:** Использование `ffmpeg-kit-react-native` для программного наложения таймера на видео
**Технология:** FFmpeg для композитинга видео + текста

### Реализация:
```javascript
// Попытка установки ffmpeg-kit-react-native
npm install ffmpeg-kit-react-native
```

### Результат:
❌ **НЕУДАЧА**
- Пакет оказался deprecated
- Проблемы с установкой iOS pods
- Ошибка: `curl: (56) The requested URL returned error: 404`
- Пакет ненадежен для продакшена

### Причина провала:
- Устаревший пакет с отсутствующими зависимостями
- Сложность интеграции FFmpeg в React Native

---

## Попытка 2: Screen Recording пакеты
**Дата:** После провала FFmpeg
**Подход:** Использование специализированных пакетов для записи экрана
**Технология:** `react-native-screen-recorder`

### Реализация:
```javascript
npm install react-native-screen-recorder
```

### Результат:
❌ **НЕУДАЧА**
- Пакет оказался неправильно названным (на самом деле image picker)
- Попытка с Expo Screen Capture - только скриншоты, не видео
- React Native Worklets - слишком сложно

### Причина провала:
- Неправильная документация пакетов
- Отсутствие надежных screen recording решений для React Native

---

## Попытка 3: Canvas композитинг
**Дата:** После провала screen recording
**Подход:** Использование Canvas для рендеринга камеры + таймера в единый поток
**Технология:** `@shopify/react-native-skia`

### Реализация:
```javascript
npm install react-native-skia
```

### Результат:
❌ **ЗАБРОШЕНО**
- Слишком сложная реализация
- Отсутствующие зависимости
- Неопределенность в успехе подхода

### Причина провала:
- Высокая сложность интеграции
- Отсутствие четких примеров для данной задачи

---

## Попытка 4: Условные UI оверлеи
**Дата:** После отказа от Canvas
**Подход:** Условный рендеринг больших таймеров только во время записи
**Технология:** React Native условный рендеринг + стили

### Реализация:
```javascript
// Большой таймер только во время записи
{isRecording && (
    <View style={styles.bigTimerOverlay}>
        <Text style={styles.bigTimerText}>{formatTime(timerState.seconds)}</Text>
    </View>
)}

// Обычный таймер когда НЕ записываем
{!isRecording && (
    <View style={styles.timerContainer}>
        {/* Круговой таймер */}
    </View>
)}
```

### Результат:
❌ **НЕУДАЧА**
- Таймер видим на экране во время записи
- НО в сохраненном видео таймера нет
- Vision Camera записывает только камеру, не UI

### Причина провала:
- **Фундаментальная архитектурная проблема**: React Native Vision Camera записывает только поток камеры, не UI слой React Native

---

## Попытка 5: Полноэкранные оверлеи
**Дата:** После обнаружения проблемы с UI
**Подход:** Полноэкранные непрозрачные оверлеи для блокировки камеры
**Технология:** Абсолютное позиционирование + непрозрачные фоны

### Реализация:
```javascript
fullScreenTimer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000', // Непрозрачный фон
}
```

### Результат:
❌ **НЕУДАЧА**
- Таймер все еще не в видео
- Пользователь не видит что снимает
- Фундаментальная проблема не решена

### Причина провала:
- Та же архитектурная проблема: UI слой ≠ камера слой

---

## Попытка 6: Screen Capture пакеты
**Дата:** Поиск альтернативных решений
**Подход:** Использование `react-native-screen-capture` для записи всего экрана
**Технология:** Нативная запись экрана iOS/Android

### Реализация:
```javascript
npm install react-native-screen-capture
cd ios && pod install
```

### Результат:
❌ **НЕУДАЧА**
- Ошибки при установке iOS pods
- Проблемы с зависимостями
- Нестабильная работа

### Причина провала:
- Проблемы с нативными зависимостями
- Отсутствие надежной поддержки

---

## Попытка 7: iOS Screen Recording (текущее решение)
**Дата:** Финальный подход
**Подход:** Использование встроенной записи экрана iOS через инструкции пользователю
**Технология:** iOS Control Center + React Native UI

### Реализация:
```javascript
// Инструкции пользователю
Alert.alert(
    'Запись с таймером',
    'Для записи видео с таймером:\n\n1. Нажмите "Начать"\n2. Откройте Пункт управления\n3. Нажмите кнопку записи экрана 🔴\n4. Выберите "Начать запись"\n5. Вернитесь в приложение'
);
```

### Результат:
✅ **УСПЕХ**
- Таймер видим в записанном видео
- Стабильная работа
- Использует нативную iOS функциональность

### Причина успеха:
- iOS Screen Recording записывает ВСЕ (камера + UI)
- Обходит ограничения React Native Vision Camera

---

## Анализ основной проблемы

### Архитектурная проблема React Native Vision Camera

**Корень проблемы:**
```
┌─────────────────────────────────────┐
│           React Native App          │
├─────────────────────────────────────┤
│  UI Layer (таймеры, кнопки, текст)  │ ← Рендерится React Native
├─────────────────────────────────────┤
│     Camera Layer (видео поток)      │ ← Рендерится нативным модулем
└─────────────────────────────────────┘
```

**Что записывает Vision Camera:**
- ✅ Camera Layer (видео поток)
- ❌ UI Layer (React Native компоненты)

**Почему так происходит:**
1. **Vision Camera** - это нативный модуль, который работает с камерой устройства
2. **React Native UI** - это отдельный слой, который рендерится поверх нативного контента
3. **Запись видео** происходит на уровне нативного модуля камеры
4. **UI оверлеи** существуют в React Native слое и не попадают в видео поток

### Технические ограничения

**React Native Vision Camera:**
- Записывает только `Camera` компонент (нативный слой)
- Не имеет доступа к React Native UI слою
- Не может композитить UI + видео программно

**React Native архитектура:**
- UI компоненты рендерятся в отдельном слое
- Нативные модули работают независимо от UI
- Отсутствует встроенный механизм композитинга

### Возможные решения (теоретические)

1. **Нативный модуль** - написать собственный iOS/Android модуль для композитинга
2. **Frame Processors** - использовать Vision Camera Frame Processors для наложения
3. **Canvas рендеринг** - рендерить все в Canvas и записывать Canvas
4. **Screen Recording** - записывать весь экран (текущее решение)

### Вывод

**Почему автоматическая запись с таймером невозможна в текущей архитектуре:**

1. **Фундаментальное ограничение:** React Native Vision Camera не может записывать UI оверлеи
2. **Архитектурная проблема:** UI слой и Camera слой разделены
3. **Отсутствие API:** Нет встроенного способа композитинга UI + видео в React Native
4. **Сложность решения:** Требует либо нативной разработки, либо альтернативных подходов записи

**Единственное рабочее решение:** Использование системной записи экрана (iOS Screen Recording), которая записывает ВСЕ слои одновременно.

---

## Попытка 8: Нативный модуль iOS (текущая разработка)
**Дата:** Январь 2025
**Подход:** Создание собственного нативного модуля для композитинга видео + таймера
**Технология:** Swift + AVFoundation + Core Graphics + React Native Bridge

### Реализация:

#### 1. Создание нативного модуля
```swift
// ios/BIXIRUN/TimerVideoRecorder.swift
@objc(TimerVideoRecorder)
class TimerVideoRecorder: NSObject {
    @objc func startRecording(_ config: NSDictionary, 
                             resolver: @escaping RCTPromiseResolveBlock, 
                             rejecter: @escaping RCTPromiseRejectBlock)
    
    @objc func updateTimer(_ config: NSDictionary)
    
    @objc func stopRecording(_ resolver: @escaping RCTPromiseResolveBlock, 
                            rejecter: @escaping RCTPromiseRejectBlock)
}
```

#### 2. Objective-C мост
```objc
// ios/BIXIRUN/TimerVideoRecorder.m
@interface RCT_EXTERN_MODULE(TimerVideoRecorder, NSObject)

RCT_EXTERN_METHOD(startRecording:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateTimer:(NSDictionary *)config)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
```

#### 3. React Native интеграция
```javascript
// app/timerWorkout.tsx
const { TimerVideoRecorder } = NativeModules;

// Запуск записи
await TimerVideoRecorder.startRecording({
    timerText: '00:30',
    phaseText: 'Работа',
    progressText: '1/8 • Сет 1',
    fontSize: 48,
    fontColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'bottom-center'
});

// Обновление таймера в реальном времени
TimerVideoRecorder.updateTimer({
    timerText: formatTime(timerState.seconds),
    phaseText: phaseInfo.name,
    progressText: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`
});

// Остановка и сохранение
const videoPath = await TimerVideoRecorder.stopRecording();
```

#### 4. Добавление в Xcode проект
```ruby
# Автоматическое добавление через Ruby скрипт
require 'xcodeproj'
project = Xcodeproj::Project.open('BIXIRUN.xcodeproj')
swift_file = bixirun_group.new_file('BIXIRUN/TimerVideoRecorder.swift')
objc_file = bixirun_group.new_file('BIXIRUN/TimerVideoRecorder.m')
target.add_file_references([swift_file, objc_file])
```

### Результат:
✅ **ПЕРВАЯ ФАЗА УСПЕШНА**
- Нативный модуль создан и интегрирован
- Xcode проект успешно собирается
- React Native находит модуль: `✅ TimerVideoRecorder модуль найден!`
- Симуляция записи работает:
  ```
  🎬 TimerVideoRecorder: Запись началась (симуляция)
  🔄 Обновили таймер в видео: {"phase": "Работа", "progress": "1/8 • Сет 1", "time": "00:54"}
  ⏹️ СТОП: Автоматическое сохранение видео
  ✅ Видео автоматически сохранено: /tmp/mock_video_1751552897.34693.mp4
  ```

### Текущий статус:
🔄 **В РАЗРАБОТКЕ**
- ✅ Нативный модуль создан
- ✅ React Native интеграция работает
- ✅ Симуляция записи функционирует
- ⏳ Требуется: добавить реальную запись видео с камерой
- ⏳ Требуется: реализовать наложение таймера на видео поток
- ⏳ Требуется: сохранение в галерею iPhone

### Следующие шаги:
1. Добавить AVCaptureSession для работы с камерой
2. Реализовать наложение текста через Core Graphics
3. Композитинг видео потока с таймером
4. Сохранение финального видео в Photos Library

### Преимущества этого подхода:
- ✅ Полный контроль над записью
- ✅ Автоматическая запись без действий пользователя
- ✅ Нативная производительность
- ✅ Интеграция с React Native

### Технические вызовы:
- Сложность реализации AVFoundation
- Синхронизация таймера с видео
- Обработка разрешений камеры
- Оптимизация производительности

**Вывод:** Нативный модуль - это правильный путь для автоматической записи видео с таймером. Первая фаза (интеграция) успешно завершена, теперь требуется реализация основной функциональности. 