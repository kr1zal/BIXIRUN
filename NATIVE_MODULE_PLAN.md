# План разработки нативного модуля для записи видео с таймером

## Архитектура решения

### Общая схема:
```
┌─────────────────────────────────────┐
│        React Native App             │
├─────────────────────────────────────┤
│  JavaScript Layer                   │
│  - Timer state                      │ ← Передаем в нативный модуль
│  - UI controls                      │
├─────────────────────────────────────┤
│  Native Module (iOS/Android)        │
│  - Camera capture                   │
│  - Text overlay rendering           │ ← Рисуем таймер на видео
│  - Video composition                │
│  - File saving                      │
└─────────────────────────────────────┘
```

## Шаг 1: Создание структуры нативного модуля

### iOS (Swift)
```
ios/
├── BIXIRUN/
│   ├── TimerVideoRecorder/
│   │   ├── TimerVideoRecorder.swift      # Основной модуль
│   │   ├── TimerVideoRecorder.m          # Objective-C bridge
│   │   ├── VideoCompositor.swift         # Композитинг видео + текст
│   │   └── TimerOverlayRenderer.swift    # Рендеринг таймера
│   └── BIXIRUN-Bridging-Header.h
```

### Android (Kotlin)
```
android/app/src/main/java/com/anonymous/BIXIRUN/
├── TimerVideoRecorderModule.kt           # Основной модуль
├── VideoCompositor.kt                    # Композитинг видео + текст
├── TimerOverlayRenderer.kt               # Рендеринг таймера
└── TimerVideoRecorderPackage.kt          # Регистрация модуля
```

## Шаг 2: Функциональность модуля

### API для React Native:
```javascript
import { TimerVideoRecorder } from 'react-native-timer-video-recorder';

// Начать запись с таймером
TimerVideoRecorder.startRecording({
    timerText: '00:30',
    phaseText: 'Работа',
    progressText: '1/8 • Сет 1',
    position: 'bottom-center', // позиция таймера
    fontSize: 48,
    fontColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 10
});

// Обновить таймер во время записи
TimerVideoRecorder.updateTimer({
    timerText: '00:29',
    phaseText: 'Работа',
    progressText: '1/8 • Сет 1'
});

// Остановить запись
TimerVideoRecorder.stopRecording().then((videoPath) => {
    console.log('Видео сохранено:', videoPath);
});
```

## Шаг 3: Техническая реализация

### iOS (AVFoundation + Core Graphics)
```swift
class TimerVideoRecorder: NSObject {
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureVideoDataOutput?
    private var assetWriter: AVAssetWriter?
    private var assetWriterInput: AVAssetWriterInput?
    
    // Настройки таймера
    private var timerText: String = ""
    private var phaseText: String = ""
    private var progressText: String = ""
    
    func startRecording(config: [String: Any]) {
        // 1. Настройка камеры
        setupCamera()
        
        // 2. Настройка записи видео
        setupVideoWriter()
        
        // 3. Начать захват кадров
        startCapture()
    }
    
    func updateTimer(config: [String: Any]) {
        // Обновляем текст таймера
        self.timerText = config["timerText"] as? String ?? ""
        self.phaseText = config["phaseText"] as? String ?? ""
        self.progressText = config["progressText"] as? String ?? ""
    }
    
    // Обработка каждого кадра
    func captureOutput(_ output: AVCaptureOutput, 
                      didOutput sampleBuffer: CMSampleBuffer, 
                      from connection: AVCaptureConnection) {
        
        // 1. Получаем кадр
        let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer)
        
        // 2. Рисуем таймер на кадре
        let overlayBuffer = addTimerOverlay(to: pixelBuffer)
        
        // 3. Записываем кадр с таймером
        writeFrame(overlayBuffer)
    }
    
    private func addTimerOverlay(to pixelBuffer: CVPixelBuffer?) -> CVPixelBuffer? {
        // Используем Core Graphics для рисования текста
        // Возвращаем кадр с наложенным таймером
    }
}
```

### Android (Camera2 + Canvas)
```kotlin
class TimerVideoRecorderModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var mediaRecorder: MediaRecorder? = null
    private var cameraDevice: CameraDevice? = null
    private var surface: Surface? = null
    
    // Настройки таймера
    private var timerText: String = ""
    private var phaseText: String = ""
    private var progressText: String = ""
    
    @ReactMethod
    fun startRecording(config: ReadableMap, promise: Promise) {
        try {
            // 1. Настройка камеры
            setupCamera()
            
            // 2. Создание Surface с наложением
            setupSurfaceWithOverlay()
            
            // 3. Начать запись
            startRecording()
            
            promise.resolve("Recording started")
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun updateTimer(config: ReadableMap) {
        timerText = config.getString("timerText") ?: ""
        phaseText = config.getString("phaseText") ?: ""
        progressText = config.getString("progressText") ?: ""
        
        // Обновляем overlay
        updateOverlay()
    }
    
    private fun setupSurfaceWithOverlay() {
        // Создаем Surface, который будет композитить камеру + таймер
        val surfaceView = SurfaceView(reactApplicationContext)
        surface = surfaceView.holder.surface
        
        // Настраиваем Canvas для рисования таймера
        setupCanvas()
    }
    
    private fun updateOverlay() {
        // Рисуем новый таймер на Canvas
        val canvas = surface?.lockCanvas(null)
        canvas?.let { c ->
            drawTimer(c, timerText, phaseText, progressText)
            surface?.unlockCanvasAndPost(c)
        }
    }
}
```

## Шаг 4: Интеграция с React Native

### Регистрация модуля (iOS)
```swift
// TimerVideoRecorder.m
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TimerVideoRecorder, NSObject)

RCT_EXTERN_METHOD(startRecording:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateTimer:(NSDictionary *)config)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

### Регистрация модуля (Android)
```kotlin
// TimerVideoRecorderPackage.kt
class TimerVideoRecorderPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(TimerVideoRecorderModule(reactContext))
    }
    
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
```

## Шаг 5: Использование в React Native

### Замена существующего кода:
```javascript
// app/timerWorkout.tsx
import { TimerVideoRecorder } from 'react-native-timer-video-recorder';

const handleStartStop = useCallback(async () => {
    if (!isRecording) {
        // СТАРТ - автоматическая запись
        try {
            await TimerVideoRecorder.startRecording({
                timerText: formatTime(timerState.seconds),
                phaseText: phaseInfo.name,
                progressText: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`,
                position: 'bottom-center',
                fontSize: 48,
                fontColor: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderRadius: 10
            });
            
            setIsRecording(true);
            dispatch(startTimer());
            
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось начать запись');
        }
    } else {
        // СТОП - автоматическое сохранение
        try {
            const videoPath = await TimerVideoRecorder.stopRecording();
            setIsRecording(false);
            dispatch(pauseTimer());
            
            Alert.alert('Успех!', `Видео с таймером сохранено!\n${videoPath}`);
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось сохранить видео');
        }
    }
}, [isRecording, timerState, phaseInfo, dispatch]);

// Обновление таймера во время записи
useEffect(() => {
    if (isRecording) {
        TimerVideoRecorder.updateTimer({
            timerText: formatTime(timerState.seconds),
            phaseText: phaseInfo.name,
            progressText: `${timerState.intervalIdx}/${timerState.cycles} • Сет ${timerState.setIdx + 1}`
        });
    }
}, [isRecording, timerState.seconds, phaseInfo.name, timerState.intervalIdx, timerState.cycles, timerState.setIdx]);
```

## Шаг 6: Преимущества нативного решения

### ✅ Что получаем:
- **Автоматическая запись** - без действий пользователя
- **Идеальное качество** - таймер рендерится прямо на видео
- **Высокая производительность** - нативный код
- **Полный контроль** - любые настройки таймера
- **Стабильность** - не зависит от внешних пакетов

### ⚙️ Технические возможности:
- Настраиваемый дизайн таймера
- Любые позиции на экране
- Анимации и эффекты
- Поддержка разных разрешений
- Оптимизация производительности

## Шаг 7: Временные затраты

### Разработка (примерные сроки):
- **iOS модуль**: 2-3 дня
- **Android модуль**: 2-3 дня  
- **Интеграция и тестирование**: 1-2 дня
- **Полировка и оптимизация**: 1 день

**Общее время**: 6-9 дней

### Сложность:
- **iOS**: Средняя (AVFoundation + Core Graphics)
- **Android**: Средняя (Camera2 + Canvas)
- **React Native Bridge**: Простая

## Заключение

Нативный модуль - это **оптимальное решение** для автоматической записи видео с таймером:

1. **Решает основную проблему** - композитинг UI + видео
2. **Полностью автоматический** - без действий пользователя
3. **Высокое качество** - профессиональный результат
4. **Расширяемость** - можно добавить любые функции

**Готов начать разработку?** Начнем с iOS модуля - он проще в реализации. 