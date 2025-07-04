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
            rejecter("ALREADY_RECORDING", "Recording is already in progress", nil)
            return
        }
        
        print("🎬 Начинаем запись видео с таймером...")
        
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
                    self?.isRecording = true
                    self?.sessionStarted = true
                    
                    // Показываем уведомление БЕЗ остановки preview
                    DispatchQueue.main.async {
                        self?.showRecordingNotification()
                    }
                    
                    resolver(["status": "started", "message": "Запись началась"])
                } else {
                    rejecter("CAMERA_ERROR", "Failed to setup camera", nil)
                }
            }
        }
    }
    
    @objc
    func updateTimer(_ config: NSDictionary) {
        DispatchQueue.main.async {
            self.timerText = config["timerText"] as? String ?? self.timerText
            self.phaseText = config["phaseText"] as? String ?? self.phaseText
            self.progressText = config["progressText"] as? String ?? self.progressText
            
            if self.isRecording {
                print("🔄 TimerVideoRecorder: Обновлен таймер - \(self.timerText) | \(self.phaseText)")
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
    
    // НОВЫЙ МЕТОД: Переключение камеры во время записи
    @objc
    func switchCamera(_ cameraPosition: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard isRecording else {
            rejecter("NOT_RECORDING", "Recording is not in progress", nil)
            return
        }
        
        print("🔄 Переключаем камеру на: \(cameraPosition)")
        
        // Временно останавливаем capture session
        captureSession?.stopRunning()
        
        // Переключаем камеру
        setupCameraSession(cameraPosition: cameraPosition) { [weak self] success in
            if success {
                resolver(["status": "switched", "camera": cameraPosition])
            } else {
                rejecter("SWITCH_ERROR", "Failed to switch camera", nil)
            }
        }
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД: Уведомление без остановки preview
    private func showRecordingNotification() {
        let alert = UIAlertController(
            title: "Запись началась",
            message: "Видео с таймером записывается автоматически!",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            // НЕ ОСТАНАВЛИВАЕМ preview здесь!
            print("✅ Пользователь подтвердил начало записи")
        })
        
        // Показываем уведомление
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first,
           let rootViewController = window.rootViewController {
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
            videoDataOutput?.setSampleBufferDelegate(self, queue: DispatchQueue.global(qos: .background))
            
            if let videoOutput = videoDataOutput, session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)
            }
            
            // Настраиваем audio output
            audioDataOutput = AVCaptureAudioDataOutput()
            audioDataOutput?.setSampleBufferDelegate(self, queue: DispatchQueue.global(qos: .background))
            
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
    
    // УЛУЧШЕННОЕ НАЛОЖЕНИЕ ТАЙМЕРА
    private func addTimerOverlay(to pixelBuffer: CVPixelBuffer) {
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }
        
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        
        // Создаем контекст для рисования
        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(pixelBuffer),
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(pixelBuffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
        ) else {
            print("❌ Не удалось создать контекст для наложения таймера")
            return
        }
        
        // Переворачиваем контекст для правильного отображения
        context.translateBy(x: 0, y: CGFloat(height))
        context.scaleBy(x: 1.0, y: -1.0)
        
        // БОЛЬШАЯ ПОДЛОЖКА для таймера
        let overlayRect = CGRect(
            x: CGFloat(width) * 0.05,
            y: CGFloat(height) * 0.75,
            width: CGFloat(width) * 0.9,
            height: CGFloat(height) * 0.2
        )
        
        // Рисуем полупрозрачную подложку
        context.setFillColor(UIColor.black.withAlphaComponent(0.8).cgColor)
        context.fill(overlayRect)
        
        // Рисуем рамку
        context.setStrokeColor(UIColor.white.cgColor)
        context.setLineWidth(3.0)
        context.stroke(overlayRect)
        
        // ОЧЕНЬ БОЛЬШОЙ ТАЙМЕР
        let timerFontSize: CGFloat = min(CGFloat(width) * 0.12, 80.0)
        let timerFont = UIFont.boldSystemFont(ofSize: timerFontSize)
        
        let timerAttributes: [NSAttributedString.Key: Any] = [
            .font: timerFont,
            .foregroundColor: UIColor.white,
            .strokeColor: UIColor.black,
            .strokeWidth: -6.0
        ]
        
        let timerSize = timerText.size(withAttributes: timerAttributes)
        let timerPoint = CGPoint(
            x: overlayRect.midX - timerSize.width / 2,
            y: overlayRect.midY - timerSize.height / 2
        )
        
        timerText.draw(at: timerPoint, withAttributes: timerAttributes)
        
        // ФАЗА И ПРОГРЕСС
        let phaseFontSize: CGFloat = min(CGFloat(width) * 0.06, 40.0)
        let phaseFont = UIFont.systemFont(ofSize: phaseFontSize, weight: .semibold)
        
        let phaseAttributes: [NSAttributedString.Key: Any] = [
            .font: phaseFont,
            .foregroundColor: UIColor.white,
            .strokeColor: UIColor.black,
            .strokeWidth: -3.0
        ]
        
        let phaseSize = phaseText.size(withAttributes: phaseAttributes)
        let phasePoint = CGPoint(
            x: overlayRect.midX - phaseSize.width / 2,
            y: overlayRect.minY + 10
        )
        
        phaseText.draw(at: phasePoint, withAttributes: phaseAttributes)
        
        // Прогресс внизу
        let progressSize = progressText.size(withAttributes: phaseAttributes)
        let progressPoint = CGPoint(
            x: overlayRect.midX - progressSize.width / 2,
            y: overlayRect.maxY - progressSize.height - 10
        )
        
        progressText.draw(at: progressPoint, withAttributes: phaseAttributes)
        
        print("✅ Наложили таймер: \\(timerText) | \\(phaseText) | \\(progressText)")
    }
    
    // MARK: - Recording Methods
    
    private func setupAssetWriter() throws {
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
        let videoPath = "\(documentsPath)/timer_video_\(Date().timeIntervalSince1970).mp4"
        outputURL = URL(fileURLWithPath: videoPath)
        
        guard let url = outputURL else {
            throw NSError(domain: "TimerVideoRecorder", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create output URL"])
        }
        
        // Удаляем файл если существует
        if FileManager.default.fileExists(atPath: videoPath) {
            try? FileManager.default.removeItem(atPath: videoPath)
        }
        
        assetWriter = try AVAssetWriter(outputURL: url, fileType: .mp4)
        
        // Настройки видео
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: 720,
            AVVideoHeightKey: 1280,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: 2000000
            ]
        ]
        
        assetWriterVideoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        assetWriterVideoInput?.expectsMediaDataInRealTime = true
        
        // Настройки аудио
        let audioSettings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 2,
            AVEncoderBitRateKey: 128000
        ]
        
        assetWriterAudioInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
        assetWriterAudioInput?.expectsMediaDataInRealTime = true
        
        // Добавляем inputs к writer
        if let videoInput = assetWriterVideoInput, assetWriter?.canAdd(videoInput) == true {
            assetWriter?.add(videoInput)
        }
        
        if let audioInput = assetWriterAudioInput, assetWriter?.canAdd(audioInput) == true {
            assetWriter?.add(audioInput)
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
        
        if output == videoDataOutput {
            // Обрабатываем видео кадр
            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
            
            // Накладываем таймер на кадр
            addTimerOverlay(to: pixelBuffer)
            
            // Записываем кадр в файл
            if let assetWriter = assetWriter,
               let videoInput = assetWriterVideoInput,
               assetWriter.status == .writing,
               videoInput.isReadyForMoreMediaData {
                
                let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
                
                // Создаем новый sample buffer с измененным pixel buffer
                var newSampleBuffer: CMSampleBuffer?
                var timingInfo = CMSampleTimingInfo(
                    duration: CMSampleBufferGetDuration(sampleBuffer),
                    presentationTimeStamp: presentationTime,
                    decodeTimeStamp: CMSampleBufferGetDecodeTimeStamp(sampleBuffer)
                )
                
                let status = CMSampleBufferCreateReadyWithImageBuffer(
                    allocator: kCFAllocatorDefault,
                    imageBuffer: pixelBuffer,
                    formatDescription: CMSampleBufferGetFormatDescription(sampleBuffer)!,
                    sampleTiming: &timingInfo,
                    sampleBufferOut: &newSampleBuffer
                )
                
                if status == noErr, let newBuffer = newSampleBuffer {
                    videoInput.append(newBuffer)
                } else {
                    print("❌ Ошибка создания sample buffer: \\(status)")
                }
            }
            
        } else if output == audioDataOutput {
            // Обрабатываем аудио кадр
            if let assetWriter = assetWriter,
               let audioInput = assetWriterAudioInput,
               assetWriter.status == .writing,
               audioInput.isReadyForMoreMediaData {
                audioInput.append(sampleBuffer)
            }
        }
    }
    
    private func processVideoSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        guard let assetWriter = assetWriter,
              let assetWriterVideoInput = assetWriterVideoInput,
              assetWriter.status == .writing,
              assetWriterVideoInput.isReadyForMoreMediaData else {
            return
        }
        
        // Start session if needed
        if assetWriter.status == .writing && !sessionStarted {
            let presentationTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
            assetWriter.startSession(atSourceTime: presentationTime)
            sessionStarted = true
        }
        
        // Get pixel buffer
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        
        // Add timer overlay
        addTimerOverlay(to: pixelBuffer)
        
        // Append sample buffer
        assetWriterVideoInput.append(sampleBuffer)
    }
    
    private func processAudioSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
        guard let assetWriter = assetWriter,
              let assetWriterAudioInput = assetWriterAudioInput,
              assetWriter.status == .writing,
              assetWriterAudioInput.isReadyForMoreMediaData else {
            return
        }
        
        assetWriterAudioInput.append(sampleBuffer)
    }
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