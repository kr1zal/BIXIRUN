import Foundation
import AVFoundation
import UIKit
import Photos
import React

@objc(TimerVideoRecorder)
class TimerVideoRecorder: NSObject {
    
    // MARK: - Properties
    private var isRecording = false
    private var captureSession: AVCaptureSession?
    private var videoOutput: AVCaptureMovieFileOutput?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var assetWriter: AVAssetWriter?
    private var assetWriterVideoInput: AVAssetWriterInput?
    private var assetWriterAudioInput: AVAssetWriterInput?
    private var videoDataOutput: AVCaptureVideoDataOutput?
    private var audioDataOutput: AVCaptureAudioDataOutput?
    
    // Timer overlay properties
    private var timerText: String = "00:00"
    private var phaseText: String = ""
    private var progressText: String = ""
    private var timerFontSize: CGFloat = 48
    private var timerFontColor: UIColor = .white
    private var timerBackgroundColor: UIColor = UIColor.black.withAlphaComponent(0.8)
    private var timerPosition: String = "bottom-center"
    
    // Recording properties
    private var outputURL: URL?
    private var sessionStarted = false
    private var writerStarted = false  // ИСПРАВЛЕНИЕ: Флаг для предотвращения повторного запуска
    private let videoQueue = DispatchQueue(label: "com.bixirun.videoQueue")
    private let audioQueue = DispatchQueue(label: "com.bixirun.audioQueue")
    
    // MARK: - React Native Bridge Methods
    
    @objc
    func checkPermissions(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        checkCameraAndMicrophonePermissions { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let permissions):
                    resolver(permissions)
                case .failure(let error):
                    rejecter("PERMISSION_ERROR", error.localizedDescription, error)
                }
            }
        }
    }
    
    @objc
    func startRecording(_ config: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard !isRecording else {
            print("⚠️ Запись уже идет")
            rejecter("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }
        
        print("🎬 СТАРТ: Начинаем запись видео с таймером...")
        
        // Извлекаем параметры
        timerText = config["timerText"] as? String ?? "00:00"
        phaseText = config["phaseText"] as? String ?? ""
        progressText = config["progressText"] as? String ?? ""
        let fontSize = config["fontSize"] as? CGFloat ?? 72.0
        let cameraPosition = config["cameraPosition"] as? String ?? "back"
        
        print("📱 Конфигурация: камера=\(cameraPosition), таймер=\(timerText), фаза=\(phaseText)")
        
        // ИСПРАВЛЕНИЕ: Настраиваем камеру БЕЗ остановки preview
        DispatchQueue.main.async {
            self.setupCameraSession(cameraPosition: cameraPosition) { [weak self] success in
                if success {
                    print("✅ Камера настроена успешно")
                    self?.isRecording = true
                    self?.sessionStarted = false // Правильно инициализируем - writer еще не запущен
                    self?.writerStarted = false // ИСПРАВЛЕНИЕ: Сбрасываем флаг writer'а
                    
                    // Показываем уведомление БЕЗ остановки preview
                    DispatchQueue.main.async {
                        self?.showRecordingNotification()
                    }
                    
                    resolver(["status": "started", "message": "Запись началась"])
                } else {
                    print("❌ Ошибка настройки камеры")
                    rejecter("CAMERA_ERROR", "Failed to setup camera", nil)
                }
            }
        }
    }
    
    @objc
    func updateTimer(_ config: NSDictionary) {
        DispatchQueue.main.async {
            let oldTimerText = self.timerText
            let oldPhaseText = self.phaseText
            let oldProgressText = self.progressText
            
            self.timerText = config["timerText"] as? String ?? self.timerText
            self.phaseText = config["phaseText"] as? String ?? self.phaseText
            self.progressText = config["progressText"] as? String ?? self.progressText
            
            if self.isRecording {
                // Проверяем, что данные действительно изменились
                if oldTimerText != self.timerText || oldPhaseText != self.phaseText || oldProgressText != self.progressText {
                    print("🔄 ОБНОВЛЕНИЕ: Таймер обновлен - \(self.timerText) | \(self.phaseText) | \(self.progressText)")
                    
                    // Проверяем статус writer'а
                    if let assetWriter = self.assetWriter {
                        print("📝 Writer статус: \(assetWriter.status.rawValue)")
                    } else {
                        print("⚠️ AssetWriter не инициализирован")
                    }
                }
            }
        }
    }
    
    @objc
    func stopRecording(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard isRecording else {
            rejecter("NOT_RECORDING", "Recording is not in progress", nil)
            return
        }
        
        print("🛑 Останавливаем запись...")
        isRecording = false
        
        // ИСПРАВЛЕНИЕ: Проверяем assetWriter перед остановкой
        guard let assetWriter = self.assetWriter,
              let videoInput = assetWriterVideoInput,
              let audioInput = assetWriterAudioInput else {
            print("❌ AssetWriter не инициализирован")
            cleanup()
            rejecter("WRITER_ERROR", "Asset writer not initialized", nil)
            return
        }
        
        print("📝 Writer статус: \(assetWriter.status.rawValue)")
        
        // Проверяем что writer в правильном состоянии
        guard assetWriter.status == .writing else {
            print("❌ Writer не в состоянии writing: \(assetWriter.status.rawValue)")
            cleanup()
            rejecter("WRITER_STATE_ERROR", "Writer is not in writing state", nil)
            return
        }
        
        // 1. Останавливаем capture session
        captureSession?.stopRunning()
        
        // 2. Помечаем inputs как finished
        videoInput.markAsFinished()
        audioInput.markAsFinished()
        
        // 3. Завершаем запись асинхронно
        assetWriter.finishWriting { [weak self] in
            DispatchQueue.main.async {
                guard let self = self else { return }
                
                if assetWriter.status == .completed {
                    guard let outputURL = self.outputURL else {
                        self.cleanup()
                        rejecter("URL_ERROR", "Output URL not available", nil)
                        return
                    }
                    
                    print("✅ Запись завершена успешно: \(outputURL.path)")
                    
                    // Сохраняем в галерею
                    self.saveVideoToGallery(url: outputURL) { [weak self] success, error in
                        DispatchQueue.main.async {
                            guard let self = self else { return }
                            
                            if success {
                                print("📱 Видео сохранено в галерею")
                                resolver(["status": "success", "videoPath": outputURL.path])
                            } else {
                                print("❌ Ошибка сохранения в галерею: \(error?.localizedDescription ?? "Unknown error")")
                                // Возвращаем путь к файлу даже если не удалось сохранить в галерею
                                resolver(["status": "saved_locally", "videoPath": outputURL.path])
                            }
                            
                            self.cleanup()
                        }
                    }
                } else {
                    let errorMessage = assetWriter.error?.localizedDescription ?? "Unknown writing error"
                    print("❌ Ошибка завершения записи: \(errorMessage)")
                    self.cleanup()
                    rejecter("WRITING_ERROR", "Failed to save video: \(errorMessage)", assetWriter.error)
                }
            }
        }
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Переключение камеры во время записи
    @objc
    func switchCamera(_ cameraPosition: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard isRecording else {
            rejecter("NOT_RECORDING", "Recording is not in progress", nil)
            return
        }
        
        print("🔄 ПЕРЕКЛЮЧЕНИЕ: Переключаем камеру на: \(cameraPosition)")
        
        // НЕ ОСТАНАВЛИВАЕМ сессию полностью, только меняем input
        guard let session = captureSession else {
            rejecter("SESSION_ERROR", "No capture session", nil)
            return
        }
        
        // Ищем текущий video input
        let currentInputs = session.inputs.compactMap { $0 as? AVCaptureDeviceInput }
        let currentVideoInput = currentInputs.first { $0.device.hasMediaType(.video) }
        
        // Получаем новую камеру
        guard let newCamera = getCameraDevice(position: cameraPosition) else {
            rejecter("CAMERA_ERROR", "Camera not found", nil)
            return
        }
        
        do {
            let newVideoInput = try AVCaptureDeviceInput(device: newCamera)
            
            session.beginConfiguration()
            
            // Удаляем старый input
            if let currentInput = currentVideoInput {
                session.removeInput(currentInput)
            }
            
            // Добавляем новый input
            if session.canAddInput(newVideoInput) {
                session.addInput(newVideoInput)
                
                // Обновляем настройки connection
                if let connection = videoDataOutput?.connection(with: .video) {
                    connection.videoOrientation = .portrait
                    connection.isVideoMirrored = (cameraPosition == "front")
                }
                
                session.commitConfiguration()
                
                print("✅ Камера переключена на: \(cameraPosition)")
                resolver(["status": "switched", "camera": cameraPosition])
                
            } else {
                session.commitConfiguration()
                rejecter("INPUT_ERROR", "Cannot add new camera input", nil)
            }
            
        } catch {
            session.commitConfiguration()
            print("❌ Ошибка создания camera input: \(error)")
            rejecter("CAMERA_INPUT_ERROR", error.localizedDescription, error)
        }
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Уведомление без остановки preview
    private func showRecordingNotification() {
        // Проверяем, не показывается ли уже alert
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {
            
            // Проверяем, что нет уже открытого alert'а
            if rootViewController.presentedViewController != nil {
                print("⚠️ Alert уже показан, пропускаем дублирование")
                return
            }
            
            let alert = UIAlertController(
                title: "Запись началась",
                message: "Видео с таймером записывается автоматически!",
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                // НЕ ОСТАНАВЛИВАЕМ preview здесь!
                print("✅ Пользователь подтвердил начало записи")
            })
            
            rootViewController.present(alert, animated: true)
        }
    }
    
    // MARK: - Permission Checks
    
    private func checkCameraAndMicrophonePermissions(completion: @escaping (Result<[String: Bool], Error>) -> Void) {
        let group = DispatchGroup()
        var cameraPermission = false
        var microphonePermission = false
        var permissionError: Error?
        
        // Check camera permission
        group.enter()
        AVCaptureDevice.requestAccess(for: .video) { granted in
            cameraPermission = granted
            if !granted {
                permissionError = NSError(domain: "TimerVideoRecorder", code: 100, userInfo: [NSLocalizedDescriptionKey: "Camera permission denied"])
            }
            group.leave()
        }
        
        // Check microphone permission
        group.enter()
        AVCaptureDevice.requestAccess(for: .audio) { granted in
            microphonePermission = granted
            if !granted && permissionError == nil {
                permissionError = NSError(domain: "TimerVideoRecorder", code: 101, userInfo: [NSLocalizedDescriptionKey: "Microphone permission denied"])
            }
            group.leave()
        }
        
        group.notify(queue: .main) {
            if let error = permissionError {
                completion(.failure(error))
            } else {
                let permissions = [
                    "camera": cameraPermission,
                    "microphone": microphonePermission
                ]
                completion(.success(permissions))
            }
        }
    }
    
    // MARK: - Camera Setup
    
    private func setupCamera(cameraPosition: String = "back") throws {
        captureSession = AVCaptureSession()
        guard let captureSession = captureSession else {
            throw NSError(domain: "TimerVideoRecorder", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create capture session"])
        }
        
        captureSession.sessionPreset = .high
        
        // ИСПРАВЛЕНИЕ: Используем переданную позицию камеры
        let position: AVCaptureDevice.Position = cameraPosition == "front" ? .front : .back
        var camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
        
        if camera == nil {
            // Если запрошенная камера недоступна, пробуем другую
            let fallbackPosition: AVCaptureDevice.Position = position == .front ? .back : .front
            guard let fallbackCamera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: fallbackPosition) else {
                throw NSError(domain: "TimerVideoRecorder", code: 3, userInfo: [NSLocalizedDescriptionKey: "No camera available"])
            }
            print("⚠️ Запрошенная камера \(cameraPosition) недоступна, используем \(fallbackPosition == .front ? "front" : "back")")
            camera = fallbackCamera
        }
        
        guard let selectedCamera = camera else {
            throw NSError(domain: "TimerVideoRecorder", code: 3, userInfo: [NSLocalizedDescriptionKey: "No camera available"])
        }
        
        let videoInput = try AVCaptureDeviceInput(device: selectedCamera)
        
        if captureSession.canAddInput(videoInput) {
            captureSession.addInput(videoInput)
        } else {
            throw NSError(domain: "TimerVideoRecorder", code: 4, userInfo: [NSLocalizedDescriptionKey: "Cannot add video input"])
        }
        
        // Audio input
        guard let audioDevice = AVCaptureDevice.default(for: .audio) else {
            throw NSError(domain: "TimerVideoRecorder", code: 5, userInfo: [NSLocalizedDescriptionKey: "Audio device not available"])
        }
        
        let audioInput = try AVCaptureDeviceInput(device: audioDevice)
        if captureSession.canAddInput(audioInput) {
            captureSession.addInput(audioInput)
        }
        
        // Video data output for processing
        videoDataOutput = AVCaptureVideoDataOutput()
        guard let videoDataOutput = videoDataOutput else { return }
        
        videoDataOutput.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        videoDataOutput.setSampleBufferDelegate(self, queue: videoQueue)
        
        if captureSession.canAddOutput(videoDataOutput) {
            captureSession.addOutput(videoDataOutput)
            
            // ИСПРАВЛЕНИЕ: Настройка соединения ПОСЛЕ добавления к сессии
            if let connection = videoDataOutput.connection(with: .video) {
                if connection.isVideoOrientationSupported {
                    connection.videoOrientation = .portrait
                }
                // Отражаем видео только для фронтальной камеры
                if connection.isVideoMirroringSupported && position == .front {
                    connection.isVideoMirrored = true
                }
            }
        }
        
        // Audio data output
        audioDataOutput = AVCaptureAudioDataOutput()
        guard let audioDataOutput = audioDataOutput else { return }
        
        audioDataOutput.setSampleBufferDelegate(self, queue: audioQueue)
        
        if captureSession.canAddOutput(audioDataOutput) {
            captureSession.addOutput(audioDataOutput)
        }
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Настройка камеры с callback
    private func setupCameraSession(cameraPosition: String, completion: @escaping (Bool) -> Void) {
        
        // Создаем новую сессию если нет
        if captureSession == nil {
            captureSession = AVCaptureSession()
        }
        
        guard let session = captureSession else {
            completion(false)
            return
        }
        
        // Настраиваем качество
        session.sessionPreset = .hd1280x720
        
        // Удаляем старые inputs
        session.inputs.forEach { session.removeInput($0) }
        session.outputs.forEach { session.removeOutput($0) }
        
        do {
            // Выбираем камеру
            guard let camera = getCameraDevice(position: cameraPosition) else {
                print("❌ Камера \\(cameraPosition) не найдена")
                completion(false)
                return
            }
            
            // Создаем input для камеры
            let videoInput = try AVCaptureDeviceInput(device: camera)
            if session.canAddInput(videoInput) {
                session.addInput(videoInput)
            }
            
            // Создаем input для микрофона
            if let audioDevice = AVCaptureDevice.default(for: .audio) {
                let audioInput = try AVCaptureDeviceInput(device: audioDevice)
                if session.canAddInput(audioInput) {
                    session.addInput(audioInput)
                }
            }
            
                    // Настраиваем video output
        videoDataOutput = AVCaptureVideoDataOutput()
        videoDataOutput?.videoSettings = [
            kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
        ]
        videoDataOutput?.setSampleBufferDelegate(self, queue: videoQueue)
        
        if let videoOutput = videoDataOutput, session.canAddOutput(videoOutput) {
            session.addOutput(videoOutput)
        }
        
        // Настраиваем audio output
        audioDataOutput = AVCaptureAudioDataOutput()
        audioDataOutput?.setSampleBufferDelegate(self, queue: audioQueue)
        
        if let audioOutput = audioDataOutput, session.canAddOutput(audioOutput) {
            session.addOutput(audioOutput)
        }
            
            // Настраиваем ориентацию
            if let connection = videoDataOutput?.connection(with: .video) {
                connection.videoOrientation = .portrait
                if cameraPosition == "front" {
                    connection.isVideoMirrored = true
                }
            }
            
            // Настраиваем asset writer
            do {
                try setupAssetWriter()
            } catch {
                print("❌ Ошибка настройки AssetWriter: \(error)")
                completion(false)
                return
            }
            
            // Запускаем сессию
            DispatchQueue.global(qos: .background).async {
                session.startRunning()
                DispatchQueue.main.async {
                    completion(true)
                }
            }
            
        } catch {
            print("❌ Ошибка настройки камеры: \\(error)")
            completion(false)
        }
    }
    
    // ✅ УПРОЩЕННОЕ НАЛОЖЕНИЕ ТАЙМЕРА - БЕЗ БЛОКИРОВКИ UI
    private func addTimerOverlay(to pixelBuffer: CVPixelBuffer) {
        // ИСПРАВЛЕНИЕ: Проверяем формат pixel buffer
        let pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
        guard pixelFormat == kCVPixelFormatType_32BGRA || pixelFormat == kCVPixelFormatType_32ARGB else {
            return // Тихо возвращаемся при неподдерживаемом формате
        }
        
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
        
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        
        // Создаем контекст
        guard let context = CGContext(
            data: baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.premultipliedFirst.rawValue
        ) else { return }
        
        guard context.width > 0 && context.height > 0 else { return }
        
        // Переворачиваем контекст
        context.translateBy(x: 0, y: CGFloat(height))
        context.scaleBy(x: 1.0, y: -1.0)
        
        // УПРОЩЕННАЯ подложка для таймера
        let overlayRect = CGRect(
            x: CGFloat(width) * 0.1,
            y: CGFloat(height) * 0.8,
            width: CGFloat(width) * 0.8,
            height: CGFloat(height) * 0.15
        )
        
        // Рисуем подложку
        context.setFillColor(UIColor.black.withAlphaComponent(0.7).cgColor)
        context.fill(overlayRect)
        
        // УПРОЩЕННЫЙ ТАЙМЕР - только основной текст
        let timerFontSize: CGFloat = min(CGFloat(width) * 0.08, 60.0)
        let timerFont = UIFont.boldSystemFont(ofSize: timerFontSize)
        
        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: timerFont,
            .foregroundColor: UIColor.white
        ]
        
        let timerSize = timerText.size(withAttributes: timerAttributes)
        let timerPoint = CGPoint(
            x: overlayRect.midX - timerSize.width / 2,
            y: overlayRect.midY - timerSize.height / 2
        )
        
        timerText.draw(at: timerPoint, withAttributes: timerAttributes)
    }
    
    // MARK: - Recording Methods
    
    private func setupAssetWriter() throws {
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
        
        // ИСПРАВЛЕНИЕ: Генерируем уникальное имя с UUID
        let uniqueID = UUID().uuidString
        let timestamp = Date().timeIntervalSince1970
        let videoPath = "\(documentsPath)/timer_video_\(Int(timestamp))_\(uniqueID).mp4"
        outputURL = URL(fileURLWithPath: videoPath)
        
        guard let url = outputURL else {
            throw NSError(domain: "TimerVideoRecorder", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create output URL"])
        }
        
        // ИСПРАВЛЕНИЕ: Более агрессивная очистка старых файлов
        do {
            let contents = try FileManager.default.contentsOfDirectory(atPath: documentsPath)
            let timerVideoFiles = contents.filter { $0.hasPrefix("timer_video_") && $0.hasSuffix(".mp4") }
            
            for file in timerVideoFiles {
                let fullPath = "\(documentsPath)/\(file)"
                try? FileManager.default.removeItem(atPath: fullPath)
                print("🗑️ Удален старый файл: \(file)")
            }
        } catch {
            print("⚠️ Не удалось очистить старые файлы: \(error)")
        }
        
        // Убеждаемся что новый файл не существует
        if FileManager.default.fileExists(atPath: videoPath) {
            try FileManager.default.removeItem(atPath: videoPath)
            print("🗑️ Удален существующий файл: \(videoPath)")
        }
        
        // ИСПРАВЛЕНИЕ: Создаем writer с правильными настройками
        do {
            assetWriter = try AVAssetWriter(outputURL: url, fileType: .mp4)
        } catch {
            print("❌ Ошибка создания AssetWriter: \(error)")
            throw error
        }
        
        // ИСПРАВЛЕННЫЕ настройки видео - используем актуальные разрешения
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: 720,
            AVVideoHeightKey: 1280,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 1500000,  // Снижаем bitrate для стабильности
                AVVideoProfileLevelKey: AVVideoProfileLevelH264BaselineAutoLevel,
                AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCAVLC
            ]
        ]
        
        assetWriterVideoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        assetWriterVideoInput?.expectsMediaDataInRealTime = true
        
        // ИСПРАВЛЕННЫЕ настройки аудио 
        let audioSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,  // Моно для меньшего размера
            AVEncoderBitRateKey: 64000  // Снижаем bitrate
        ]
        
        assetWriterAudioInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
        assetWriterAudioInput?.expectsMediaDataInRealTime = true
        
        // ПРОВЕРЯЕМ перед добавлением inputs
        guard let writer = assetWriter else {
            throw NSError(domain: "TimerVideoRecorder", code: 2, userInfo: [NSLocalizedDescriptionKey: "AssetWriter not initialized"])
        }
        
        if let videoInput = assetWriterVideoInput {
            if writer.canAdd(videoInput) {
                writer.add(videoInput)
                print("✅ VideoInput добавлен")
            } else {
                print("❌ Не удалось добавить VideoInput")
                throw NSError(domain: "TimerVideoRecorder", code: 3, userInfo: [NSLocalizedDescriptionKey: "Cannot add video input"])
            }
        }
        
        if let audioInput = assetWriterAudioInput {
            if writer.canAdd(audioInput) {
                writer.add(audioInput)
                print("✅ AudioInput добавлен")
            } else {
                print("❌ Не удалось добавить AudioInput")
                throw NSError(domain: "TimerVideoRecorder", code: 4, userInfo: [NSLocalizedDescriptionKey: "Cannot add audio input"])
            }
        }
        
        print("✅ AssetWriter настроен: \(videoPath)")
    }
    
    private func saveVideoToGallery(url: URL, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.requestAuthorization { status in
            guard status == .authorized else {
                completion(false, NSError(domain: "TimerVideoRecorder", code: 14, userInfo: [NSLocalizedDescriptionKey: "Photos access denied"]))
                return
            }
            
            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
            }) { success, error in
                completion(success, error)
            }
        }
    }
    
    // MARK: - Camera Switching
    
    // MARK: - Camera Switching (метод уже определен выше)
    
    // MARK: - Timer Overlay (УДАЛЯЕМ ДУБЛИРОВАННЫЙ МЕТОД)
    
    // MARK: - Timer Overlay (используем улучшенную версию выше)
    
    // MARK: - Configuration
    
    private func parseConfig(_ config: NSDictionary) {
        if let timer = config["timerText"] as? String {
            timerText = timer
        }
        if let phase = config["phaseText"] as? String {
            phaseText = phase
        }
        if let progress = config["progressText"] as? String {
            progressText = progress
        }
        if let fontSize = config["fontSize"] as? NSNumber {
            timerFontSize = CGFloat(fontSize.floatValue)
        }
        if let fontColorHex = config["fontColor"] as? String {
            timerFontColor = parseColor(fontColorHex) ?? .white
        }
        if let backgroundColorString = config["backgroundColor"] as? String {
            timerBackgroundColor = parseColor(backgroundColorString) ?? UIColor.black.withAlphaComponent(0.8)
        }
        if let position = config["position"] as? String {
            timerPosition = position
        }
        
        print("🔧 TimerVideoRecorder: Конфигурация загружена")
        print("   - Таймер: \(timerText)")
        print("   - Фаза: \(phaseText)")
        print("   - Прогресс: \(progressText)")
        print("   - Размер шрифта: \(timerFontSize)")
        print("   - Позиция: \(timerPosition)")
    }
    
    // MARK: - Color Parsing
    
    private func parseColor(_ colorString: String) -> UIColor? {
        // Handle rgba(r,g,b,a) format
        if colorString.hasPrefix("rgba(") && colorString.hasSuffix(")") {
            let rgba = colorString.dropFirst(5).dropLast(1)
            let components = rgba.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            
            if components.count == 4,
               let r = Float(components[0]),
               let g = Float(components[1]),
               let b = Float(components[2]),
               let a = Float(components[3]) {
                return UIColor(red: CGFloat(r/255), green: CGFloat(g/255), blue: CGFloat(b/255), alpha: CGFloat(a))
            }
        }
        
        // Handle hex format
        if colorString.hasPrefix("#") {
            return UIColor(hex: colorString)
        }
        
        // Handle named colors
        switch colorString.lowercased() {
        case "white": return .white
        case "black": return .black
        case "red": return .red
        case "green": return .green
        case "blue": return .blue
        case "yellow": return .yellow
        case "orange": return .orange
        case "purple": return .purple
        case "gray": return .gray
        default: return nil
        }
    }
    
    // MARK: - React Native Required Methods
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    private func cleanup() {
        // Очищаем все ресурсы
        assetWriter = nil
        assetWriterVideoInput = nil
        assetWriterAudioInput = nil
        videoDataOutput = nil
        audioDataOutput = nil
        outputURL = nil
        sessionStarted = false
        writerStarted = false // ИСПРАВЛЕНИЕ: Сбрасываем флаг writer'а
        
        // Останавливаем capture session если еще работает
        if let session = captureSession, session.isRunning {
            session.stopRunning()
        }
        captureSession = nil
        
        print("🧹 Ресурсы очищены")
    }
    
    // MARK: - Helper Methods
    
    private func getCameraDevice(position: String) -> AVCaptureDevice? {
        let devicePosition: AVCaptureDevice.Position = position == "front" ? .front : .back
        
        if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: devicePosition) {
            return device
        }
        
        // Fallback для старых устройств
        let devices = AVCaptureDevice.devices(for: .video)
        return devices.first { $0.position == devicePosition }
    }
}

// MARK: - AVCaptureVideoDataOutputSampleBufferDelegate & AVCaptureAudioDataOutputSampleBufferDelegate

extension TimerVideoRecorder: AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
    
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        
        guard isRecording else { return }
        
        // ИСПРАВЛЕНИЕ: Запускаем writer при первом кадре ТОЛЬКО ОДИН РАЗ
        if let assetWriter = assetWriter, assetWriter.status == .unknown, !writerStarted {
            print("🎬 Запускаем AssetWriter...")
            writerStarted = true // ИСПРАВЛЕНИЕ: Устанавливаем флаг сразу
            
            // Проверяем готовность writer'а
            guard assetWriter.inputs.count > 0 else {
                print("❌ AssetWriter не имеет inputs")
                writerStarted = false // Сбрасываем флаг при ошибке
                return
            }
            
            // Запускаем запись
            assetWriter.startWriting()
            
            // ПОДРОБНАЯ ДИАГНОСТИКА статуса
            print("📊 AssetWriter статус после startWriting: \(assetWriter.status.rawValue)")
            
            if assetWriter.status == .writing {
                let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
                assetWriter.startSession(atSourceTime: presentationTime)
                sessionStarted = true
                print("✅ AssetWriter запущен в режиме записи")
            } else {
                print("❌ AssetWriter не смог запуститься. Статус: \(assetWriter.status.rawValue)")
                writerStarted = false // Сбрасываем флаг при ошибке
                
                if let error = assetWriter.error {
                    print("❌ Ошибка AssetWriter: \(error)")
                    print("❌ Локализованное описание: \(error.localizedDescription)")
                }
                
                // Пытаемся понять в чем проблема
                switch assetWriter.status {
                case .failed:
                    print("❌ AssetWriter failed - проверьте настройки видео/аудио")
                case .cancelled:
                    print("❌ AssetWriter cancelled")
                case .completed:
                    print("❌ AssetWriter уже completed")
                default:
                    print("❌ AssetWriter в неопределенном состоянии")
                }
                return
            }
        }
        
        if output == videoDataOutput {
            // Обрабатываем видео кадр
            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { 
                print("❌ Не удалось получить pixel buffer")
                return 
            }
            
            // Накладываем таймер на кадр
            addTimerOverlay(to: pixelBuffer)
            
            // Записываем кадр в файл
            if let assetWriter = assetWriter,
               let videoInput = assetWriterVideoInput {
                
                // ДЕТАЛЬНАЯ ПРОВЕРКА статуса
                if assetWriter.status != .writing {
                    print("⚠️ AssetWriter не в режиме записи: \(assetWriter.status.rawValue)")
                    
                    // Выводим детали ошибки
                    if let error = assetWriter.error {
                        print("❌ Ошибка AssetWriter: \(error)")
                    }
                    return
                }
                
                if !videoInput.isReadyForMoreMediaData {
                    print("⚠️ VideoInput не готов для новых данных")
                    return
                }
                
                let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
                
                // ИСПРАВЛЕНИЕ: Создаем новый sample buffer с правильными параметрами
                var newSampleBuffer: CMSampleBuffer?
                var timingInfo = CMSampleTimingInfo(
                    duration: CMSampleBufferGetDuration(sampleBuffer),
                    presentationTimeStamp: presentationTime,
                    decodeTimeStamp: CMSampleBufferGetDecodeTimeStamp(sampleBuffer)
                )
                
                guard let formatDescription = CMSampleBufferGetFormatDescription(sampleBuffer) else {
                    print("❌ Не удалось получить format description")
                    return
                }
                
                let status = CMSampleBufferCreateReadyWithImageBuffer(
                    allocator: kCFAllocatorDefault,
                    imageBuffer: pixelBuffer,
                    formatDescription: formatDescription,
                    sampleTiming: &timingInfo,
                    sampleBufferOut: &newSampleBuffer
                )
                
                if status == noErr, let newBuffer = newSampleBuffer {
                    let appendSuccess = videoInput.append(newBuffer)
                    if !appendSuccess {
                        print("❌ Не удалось добавить видео кадр. Writer статус: \(assetWriter.status.rawValue)")
                        if let error = assetWriter.error {
                            print("❌ Ошибка при добавлении кадра: \(error)")
                        }
                    }
                } else {
                    print("❌ Ошибка создания sample buffer. OSStatus: \(status)")
                }
            } else {
                print("❌ AssetWriter или VideoInput не инициализированы")
            }
            
        } else if output == audioDataOutput {
            // Обрабатываем аудио кадр
            if let assetWriter = assetWriter,
               let audioInput = assetWriterAudioInput,
               assetWriter.status == .writing,
               audioInput.isReadyForMoreMediaData {
                let appendSuccess = audioInput.append(sampleBuffer)
                if !appendSuccess {
                    print("❌ Не удалось добавить аудио кадр. Writer статус: \(assetWriter.status.rawValue)")
                    if let error = assetWriter.error {
                        print("❌ Ошибка при добавлении аудио: \(error)")
                    }
                }
            }
        }
    }
    
    // УДАЛЯЕМ ДУБЛИРОВАННЫЕ МЕТОДЫ - они не используются
}

// MARK: - UIColor Extension

extension UIColor {
    convenience init?(hex: String) {
        let r, g, b, a: CGFloat
        
        if hex.hasPrefix("#") {
            let start = hex.index(hex.startIndex, offsetBy: 1)
            let hexColor = String(hex[start...])
            
            if hexColor.count == 8 {
                let scanner = Scanner(string: hexColor)
                var hexNumber: UInt64 = 0
                
                if scanner.scanHexInt64(&hexNumber) {
                    r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                    g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                    b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                    a = CGFloat(hexNumber & 0x000000ff) / 255
                    
                    self.init(red: r, green: g, blue: b, alpha: a)
                    return
                }
            } else if hexColor.count == 6 {
                let scanner = Scanner(string: hexColor)
                var hexNumber: UInt64 = 0
                
                if scanner.scanHexInt64(&hexNumber) {
                    r = CGFloat((hexNumber & 0xff0000) >> 16) / 255
                    g = CGFloat((hexNumber & 0x00ff00) >> 8) / 255
                    b = CGFloat(hexNumber & 0x0000ff) / 255
                    a = 1.0
                    
                    self.init(red: r, green: g, blue: b, alpha: a)
                    return
                }
            }
        }
        
        return nil
    }
}