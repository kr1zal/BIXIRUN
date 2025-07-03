# Анализ проблемы: Автоматическая запись видео с таймером

## Суть проблемы

**Задача:** Автоматическая запись видео с наложением таймера без действий пользователя
**Проблема:** React Native Vision Camera не может записывать UI оверлеи

## Корневая причина

### 1. Архитектурное ограничение React Native

```
┌─────────────────────────────────────┐
│        React Native App             │
├─────────────────────────────────────┤
│  JavaScript Layer                   │
│  - Timer components                 │ ← НЕ записывается
│  - UI overlays                      │
│  - Text, buttons                    │
├─────────────────────────────────────┤
│  Native Layer                       │
│  - Camera stream                    │ ← ЗАПИСЫВАЕТСЯ
│  - Hardware access                  │
└─────────────────────────────────────┘
```

### 2. Как работает React Native Vision Camera

**Vision Camera записывает:**
- ✅ Нативный поток камеры
- ✅ Данные с сенсора камеры
- ✅ Аудио поток

**Vision Camera НЕ записывает:**
- ❌ React Native UI компоненты
- ❌ Text, View, TouchableOpacity
- ❌ Styled Components
- ❌ Любые JavaScript элементы

### 3. Техническое объяснение

**React Native Vision Camera** - это bridge к нативным API камеры:
- iOS: `AVCaptureSession`
- Android: `Camera2 API`

Эти API работают с **аппаратным слоем**, не с UI слоем React Native.

## Почему все попытки провалились

### Попытка 1: UI Overlays
```javascript
{isRecording && (
    <View style={styles.timerOverlay}>
        <Text>{timer}</Text>
    </View>
)}
```
**Почему не работает:** UI рендерится в JavaScript слое, Vision Camera записывает нативный слой

### Попытка 2: Полноэкранные оверлеи
```javascript
backgroundColor: '#000', // Непрозрачный фон
position: 'absolute',
top: 0, left: 0, right: 0, bottom: 0
```
**Почему не работает:** Даже непрозрачный фон - это UI элемент, который не попадает в видео поток

### Попытка 3: FFmpeg композитинг
```javascript
// Программное наложение текста на видео
ffmpeg -i video.mp4 -vf "drawtext=text='Timer'" output.mp4
```
**Почему не работает:** Пакеты deprecated, сложность интеграции, нестабильность

## Возможные решения

### 1. Frame Processors (сложно)
```javascript
const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    // Рисуем таймер прямо на кадрах видео
    drawText(frame, timerValue)
}, [timerValue])
```

**Плюсы:**
- Работает на уровне видео потока
- Таймер будет в записи

**Минусы:**
- Очень сложная реализация
- Требует знания Worklets
- Производительность под вопросом

### 2. Canvas композитинг (очень сложно)
```javascript
// Рендерим камеру + UI в Canvas
<Canvas>
    <CameraStream />
    <TimerOverlay />
</Canvas>
```

**Плюсы:**
- Полный контроль над композитингом
- Единый поток для записи

**Минусы:**
- Очень сложная реализация
- Проблемы с производительностью
- Много зависимостей

### 3. Нативный модуль (максимально сложно)
```swift
// iOS Swift код
class TimerVideoRecorder {
    func startRecordingWithTimer() {
        // Нативная запись с наложением
    }
}
```

**Плюсы:**
- Полный контроль
- Максимальная производительность

**Минусы:**
- Требует знания iOS/Android разработки
- Долгая разработка
- Поддержка двух платформ

### 4. Screen Recording (текущее решение)
```javascript
// Использование системной записи экрана
iOS Control Center -> Screen Recording
```

**Плюсы:**
- ✅ Работает из коробки
- ✅ Записывает ВСЕ (камера + UI)
- ✅ Стабильно и надежно

**Минусы:**
- ❌ Требует действий пользователя
- ❌ Не автоматическое

## Рекомендации

### Для автоматической записи:

**1. Frame Processors (рекомендуется)**
- Изучить Vision Camera Frame Processors
- Реализовать наложение таймера на уровне кадров
- Использовать Worklets для производительности

**2. Canvas решение**
- Рассмотреть Skia Canvas
- Композитинг камеры + таймера в Canvas
- Запись Canvas потока

**3. Гибридное решение**
- Комбинация нативного модуля + React Native
- Нативная запись с React Native UI

### Для быстрого решения:

**Screen Recording (текущее)**
- Улучшить UX инструкций
- Добавить автоматическое определение записи
- Оптимизировать процесс для пользователя

## Заключение

**Автоматическая запись видео с таймером в React Native - это сложная задача** из-за архитектурных ограничений.

**Основные барьеры:**
1. Разделение UI и нативного слоя
2. Ограничения Vision Camera
3. Отсутствие готовых решений

**Лучшие варианты:**
1. **Frame Processors** - для автоматического решения
2. **Screen Recording** - для быстрого решения
3. **Нативный модуль** - для максимального контроля

**Текущее решение (Screen Recording)** - это компромисс между сложностью реализации и функциональностью.

---

## Обновление: Нативный модуль (Январь 2025)

### Прогресс по нативному модулю

**Статус:** ✅ Первая фаза завершена успешно

#### Что реализовано:

**1. Нативный модуль iOS**
```swift
@objc(TimerVideoRecorder)
class TimerVideoRecorder: NSObject {
    // Симуляция записи с таймером
    private var isRecording = false
    private var timerText: String = "00:00"
    private var phaseText: String = ""
    private var progressText: String = ""
}
```

**2. React Native интеграция**
```javascript
const { TimerVideoRecorder } = NativeModules;

// Проверка модуля
if (!TimerVideoRecorder) {
    console.error('❌ TimerVideoRecorder нативный модуль не найден!');
    return false;
}
console.log('✅ TimerVideoRecorder модуль найден!');
```

**3. Автоматическое добавление в Xcode**
- Создан Ruby скрипт для автоматического добавления файлов
- Файлы успешно интегрированы в проект
- Проект собирается без ошибок

#### Результаты тестирования:

```
✅ TimerVideoRecorder модуль найден!
🎬 TimerVideoRecorder: Запись началась (симуляция)
🔄 Обновили таймер в видео: {"phase": "Работа", "progress": "1/8 • Сет 1", "time": "00:54"}
⏹️ СТОП: Автоматическое сохранение видео
✅ Видео автоматически сохранено: /tmp/mock_video_1751552897.34693.mp4
```

### Архитектурное решение

**Принцип работы:**
```
┌─────────────────────────────────────┐
│        React Native App             │
├─────────────────────────────────────┤
│  JavaScript Layer                   │
│  - Timer logic                      │ ← Отправляет данные
│  - UI controls                      │
├─────────────────────────────────────┤
│  Native Module Bridge               │ ← Передает команды
├─────────────────────────────────────┤
│  iOS Native Layer                   │
│  - AVCaptureSession                 │ ← Записывает видео
│  - Core Graphics                    │ ← Рисует таймер
│  - Video Composition                │ ← Композитинг
└─────────────────────────────────────┘
```

**Преимущества:**
- ✅ Обходит ограничения Vision Camera
- ✅ Полный контроль над композитингом
- ✅ Автоматическая запись без действий пользователя
- ✅ Нативная производительность

### Следующие этапы

**Этап 2: Реальная запись видео**
1. Добавить AVCaptureSession
2. Настроить камеру и аудио
3. Создать AVAssetWriter для записи

**Этап 3: Наложение таймера**
1. Использовать Core Graphics для рисования текста
2. Создать AVVideoCompositionCoreAnimationTool
3. Синхронизировать таймер с видео

**Этап 4: Сохранение и оптимизация**
1. Сохранение в Photos Library
2. Обработка разрешений
3. Оптимизация производительности

### Техническая реализация (план)

**AVFoundation структура:**
```swift
class TimerVideoRecorder: NSObject {
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureMovieFileOutput?
    private var videoComposition: AVMutableVideoComposition?
    
    func startRecording() {
        // 1. Настройка камеры
        setupCaptureSession()
        
        // 2. Создание композиции с таймером
        createVideoComposition()
        
        // 3. Запуск записи
        startVideoRecording()
    }
}
```

**Наложение таймера:**
```swift
func createTimerLayer() -> CALayer {
    let timerLayer = CATextLayer()
    timerLayer.string = timerText
    timerLayer.fontSize = 48
    timerLayer.foregroundColor = UIColor.white.cgColor
    timerLayer.backgroundColor = UIColor.black.withAlphaComponent(0.8).cgColor
    return timerLayer
}
```

### Вывод

**Нативный модуль - это правильное решение** для автоматической записи видео с таймером:

1. **Решает основную проблему:** Обходит ограничения React Native Vision Camera
2. **Архитектурно корректно:** Работает на нативном уровне с прямым доступом к камере
3. **Масштабируемо:** Можно добавить любые функции записи
4. **Производительно:** Нативная реализация без промежуточных слоев

**Текущий прогресс:** Первая фаза (интеграция) завершена успешно. Модуль работает, остается добавить реальную функциональность записи видео. 