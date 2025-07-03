import Foundation
import AVFoundation
import UIKit
import Photos
import React

@objc(TimerVideoRecorder)
class TimerVideoRecorder: NSObject {
    
    // MARK: - Properties
    private var isRecording = false
    
    // Timer overlay properties
    private var timerText: String = "00:00"
    private var phaseText: String = ""
    private var progressText: String = ""
    
    // MARK: - React Native Bridge Methods
    
    @objc
    func startRecording(_ config: NSDictionary, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        DispatchQueue.main.async {
            do {
                // Parse configuration
                self.parseConfig(config)
                
                // Для первого теста просто симулируем запись
                self.isRecording = true
                
                print("🎬 TimerVideoRecorder: Запись началась (симуляция)")
                print("⏱️ Таймер: \(self.timerText)")
                print("📝 Фаза: \(self.phaseText)")
                print("📊 Прогресс: \(self.progressText)")
                
                resolver("Recording started successfully")
                
            } catch {
                rejecter("RECORDING_ERROR", "Failed to start recording: \(error.localizedDescription)", error)
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
        
        DispatchQueue.main.async {
            guard self.isRecording else {
                rejecter("NOT_RECORDING", "Recording is not active", nil)
                return
            }
            
            self.isRecording = false
            
            print("⏹️ TimerVideoRecorder: Запись остановлена (симуляция)")
            
            // Симулируем сохранение видео
            let mockVideoPath = "/tmp/mock_video_\(Date().timeIntervalSince1970).mp4"
            
            resolver(mockVideoPath)
        }
    }
    
    // MARK: - Private Methods
    
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
        
        print("🔧 TimerVideoRecorder: Конфигурация загружена")
        print("   - Таймер: \(timerText)")
        print("   - Фаза: \(phaseText)")
        print("   - Прогресс: \(progressText)")
    }
    
    // MARK: - React Native Required Methods
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
} 