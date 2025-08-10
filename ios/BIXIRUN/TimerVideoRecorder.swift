// TimerVideoRecorder.swift
// Lightweight implementation that records camera input and overlays timer text.
// Focus: get a reliable MVP working to unblock RN side.

import AVFoundation
import React
import Photos
import UIKit
import ReplayKit

@objc(TimerVideoRecorder)
class TimerVideoRecorder: NSObject {
  // Shared singletons
  private let session = AVCaptureSession()
  private let videoOutput = AVCaptureVideoDataOutput()
  private let audioOutput = AVCaptureAudioDataOutput()
  private var audioInput: AVCaptureDeviceInput?
  private var videoInput: AVCaptureDeviceInput?

  // Writing
  private var assetWriter: AVAssetWriter?
  private var videoWriterInput: AVAssetWriterInput?
  private var pixelBufferAdaptor: AVAssetWriterInputPixelBufferAdaptor?
  private var audioWriterInput: AVAssetWriterInput?
  private var startTime: CMTime = .zero
  private var ciContext = CIContext()
  private var outputSize: CGSize = .zero
  private var writerStarted: Bool = false
  private var useReplayKit: Bool = true
  private var isReplayKitRecording: Bool = false

  // Overlay state
  private var overlayTimerText: String = "00:00"
  private var overlayPhaseText: String = ""
  private var overlayProgressText: String = ""
  private var fontSize: CGFloat = 48
  private var fontColor: UIColor = .white
  private var backgroundColor: UIColor = UIColor(white: 0, alpha: 0.8)
  private var borderRadius: CGFloat = 10
  private var position: String = "bottom-center"

  // Config
  private var orientation: AVCaptureVideoOrientation = .portrait
  private var cameraPosition: AVCaptureDevice.Position = .back

  private let queue = DispatchQueue(label: "TimerVideoRecorder.queue")

  // MARK: - Public API
  @objc
  func startRecording(_ config: NSDictionary,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      do {
        try self.configure(from: config)

        // Prefer ReplayKit to avoid conflicts with VisionCamera preview
        if self.useReplayKit {
          DispatchQueue.main.async {
            let recorder = RPScreenRecorder.shared()
            guard recorder.isAvailable else {
              reject("start_error", "ReplayKit is not available on this device", nil)
              return
            }
            recorder.isMicrophoneEnabled = true
            recorder.startRecording { error in
              if let err = error {
                reject("start_error", err.localizedDescription, err)
              } else {
                self.isReplayKitRecording = true
                resolve(["status": "started", "message": "recording"]) 
              }
            }
          }
          return
        }

        // Fallback: internal AV capture pipeline
        try self.startSession()
        try self.startWriter()
        resolve(["status": "started", "message": "recording"]) 
      } catch {
        reject("start_error", error.localizedDescription, error)
      }
    }
  }

  @objc
  func updateTimer(_ config: NSDictionary) {
    if let t = config["timerText"] as? String { overlayTimerText = t }
    if let p = config["phaseText"] as? String { overlayPhaseText = p }
    if let g = config["progressText"] as? String { overlayProgressText = g }
  }

  @objc
  func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      do {
        if self.useReplayKit && self.isReplayKitRecording {
          self.isReplayKitRecording = false
          let tmpDir = NSTemporaryDirectory()
          let path = (tmpDir as NSString).appendingPathComponent("timer_rp_\(Int(Date().timeIntervalSince1970)).mp4")
          let url = URL(fileURLWithPath: path)

          DispatchQueue.main.async {
            RPScreenRecorder.shared().stopRecording(withOutput: url) { error in
              if let err = error {
                reject("stop_error", err.localizedDescription, err)
                return
              }
              self.saveToPhotosAndResolve(url: url, resolve: resolve)
            }
          }
          return
        }

        // Fallback path for internal AV capture pipeline
        try self.finishWriter()
        self.session.stopRunning()
        let path = self.exportedPath ?? ""
        let url = URL(fileURLWithPath: path)
        self.saveToPhotosAndResolve(url: url, resolve: resolve)
      } catch {
        reject("stop_error", error.localizedDescription, error)
      }
    }
  }

  @objc
  func switchCamera(_ cameraPosition: NSString,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    queue.async {
      let newPos: AVCaptureDevice.Position = (cameraPosition as String) == "front" ? .front : .back
      do {
        try self.reconfigureCamera(position: newPos)
        resolve(["status": "ok", "camera": (newPos == .front ? "front" : "back")])
      } catch {
        reject("switch_error", error.localizedDescription, error)
      }
    }
  }

  // MARK: - Private
  private func configure(from config: NSDictionary) throws {
    overlayTimerText = config["timerText"] as? String ?? overlayTimerText
    overlayPhaseText = config["phaseText"] as? String ?? overlayPhaseText
    overlayProgressText = config["progressText"] as? String ?? overlayProgressText
    if let s = config["fontSize"] as? NSNumber { fontSize = CGFloat(truncating: s) }
    if let c = config["fontColor"] as? String { fontColor = UIColor(hex: c) ?? .white }
    if let bg = config["backgroundColor"] as? String { backgroundColor = UIColor(rgba: bg) ?? backgroundColor }
    if let r = config["borderRadius"] as? NSNumber { borderRadius = CGFloat(truncating: r) }
    if let p = config["position"] as? String { position = p }
    if let cp = config["cameraPosition"] as? String { cameraPosition = (cp == "front" ? .front : .back) }
    if let o = config["videoOrientation"] as? String { orientation = (o == "landscape" ? .landscapeRight : .portrait) }
  }

  private func startSession() throws {
    session.beginConfiguration()
    session.sessionPreset = .high

    // video
    if let videoInput = self.videoInput { session.removeInput(videoInput) }
    let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: cameraPosition)
    guard let v = videoDevice else { throw NSError(domain: "TimerVideoRecorder", code: -10, userInfo: [NSLocalizedDescriptionKey: "No camera"]) }
    let vi = try AVCaptureDeviceInput(device: v)
    session.addInput(vi)
    self.videoInput = vi

    // audio
    if let audioInput = self.audioInput { session.removeInput(audioInput) }
    if let audioDevice = AVCaptureDevice.default(for: .audio) {
      let ai = try AVCaptureDeviceInput(device: audioDevice)
      if session.canAddInput(ai) {
        session.addInput(ai)
        self.audioInput = ai
      }
    }

    videoOutput.setSampleBufferDelegate(self, queue: queue)
    videoOutput.alwaysDiscardsLateVideoFrames = true
    if session.canAddOutput(videoOutput) { session.addOutput(videoOutput) }
    if let c = videoOutput.connection(with: .video) { c.videoOrientation = orientation }

    // audio output
    audioOutput.setSampleBufferDelegate(self, queue: queue)
    if session.canAddOutput(audioOutput) { session.addOutput(audioOutput) }

    session.commitConfiguration()
    // Сразу запускаем сессию (превью от VisionCamera), запись запускается отдельно
    if !session.isRunning {
      session.startRunning()
    }
  }

  private var exportedPath: String?

  private func startWriter() throws {
    // temp file
    let tmpDir = NSTemporaryDirectory()
    let path = (tmpDir as NSString).appendingPathComponent("timer_record_\(Int(Date().timeIntervalSince1970)).mp4")
    exportedPath = path
    let url = URL(fileURLWithPath: path)
    assetWriter = try AVAssetWriter(outputURL: url, fileType: .mp4)

    // Until we see first frame, fall back to 1080x1920 portrait
    if outputSize == .zero { outputSize = CGSize(width: 1080, height: 1920) }
    let videoSettings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: Int(outputSize.width),
      AVVideoHeightKey: Int(outputSize.height)
    ]
    let vInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
    vInput.expectsMediaDataInRealTime = true
    let attrs: [String: Any] = [
      kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
      kCVPixelBufferWidthKey as String: Int(outputSize.width),
      kCVPixelBufferHeightKey as String: Int(outputSize.height),
      kCVPixelBufferIOSurfacePropertiesKey as String: [:]
    ]
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: vInput, sourcePixelBufferAttributes: attrs)
    guard let writer = assetWriter, writer.canAdd(vInput) else { throw NSError(domain: "TimerVideoRecorder", code: -11, userInfo: [NSLocalizedDescriptionKey: "Writer inputs error"]) }
    writer.add(vInput)
    self.videoWriterInput = vInput
    self.pixelBufferAdaptor = adaptor

    // audio input (AAC)
    let audioSettings: [String: Any] = [
      AVFormatIDKey: kAudioFormatMPEG4AAC as NSNumber,
      AVNumberOfChannelsKey: 1,
      AVSampleRateKey: 44100,
      AVEncoderBitRateKey: 128000
    ]
    let aInput = AVAssetWriterInput(mediaType: .audio, outputSettings: audioSettings)
    aInput.expectsMediaDataInRealTime = true
    if writer.canAdd(aInput) { writer.add(aInput); self.audioWriterInput = aInput }
    // Delay start until first video frame to ensure correct PTS
    writerStarted = false
    startTime = .zero
  }

  private func finishWriter() throws {
    guard let writer = assetWriter else { return }

    switch writer.status {
    case .writing:
      videoWriterInput?.markAsFinished()
      audioWriterInput?.markAsFinished()
      let semaphore = DispatchSemaphore(value: 0)
      writer.finishWriting { semaphore.signal() }
      _ = semaphore.wait(timeout: .now() + 10)
    case .unknown:
      // started session, but never received a frame
      writer.cancelWriting()
    case .failed, .cancelled, .completed:
      break
    @unknown default:
      break
    }

    assetWriter = nil
    videoWriterInput = nil
    pixelBufferAdaptor = nil
    audioWriterInput = nil
  }

  private func reconfigureCamera(position: AVCaptureDevice.Position) throws {
    cameraPosition = position
    try startSession()
  }

  private func saveToPhotosAndResolve(url: URL, resolve: @escaping RCTPromiseResolveBlock) {
    let path = url.path
    if !FileManager.default.fileExists(atPath: path) {
      resolve(["status": "error", "message": "Output file not found"]) 
      return
    }
    PHPhotoLibrary.requestAuthorization { status in
      if status == .authorized || status == .limited {
        PHPhotoLibrary.shared().performChanges({
          PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
        }) { success, error in
          if success {
            resolve(["status": "success", "videoPath": path])
          } else {
            resolve(["status": "saved_locally", "videoPath": path, "message": error?.localizedDescription ?? ""]) 
          }
        }
      } else {
        resolve(["status": "saved_locally", "videoPath": path, "message": "No Photos permission"]) 
      }
    }
  }
}

extension TimerVideoRecorder: AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    // If using ReplayKit, ignore internal pipeline
    if useReplayKit { return }
    guard let writer = assetWriter else { return }

    // Video frames
    if output == videoOutput {
      guard let input = videoWriterInput, input.isReadyForMoreMediaData,
            let adaptor = pixelBufferAdaptor,
            let imageBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

      let time = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
      if !writerStarted {
        startTime = time
        writer.startWriting()
        writer.startSession(atSourceTime: time)
        writerStarted = true
      }

      let srcWidth = CVPixelBufferGetWidth(imageBuffer)
      let srcHeight = CVPixelBufferGetHeight(imageBuffer)
      if outputSize == .zero { outputSize = CGSize(width: srcWidth, height: srcHeight) }

      var pxBufferOptional: CVPixelBuffer?
      guard let pool = adaptor.pixelBufferPool,
            CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pxBufferOptional) == kCVReturnSuccess,
            let pxBuffer = pxBufferOptional else { return }

      // Render camera frame into BGRA buffer
      ciContext.render(CIImage(cvPixelBuffer: imageBuffer), to: pxBuffer)

      // Draw overlay into the same pixel buffer
      CVPixelBufferLockBaseAddress(pxBuffer, [])
      if let ctx = CGContext(data: CVPixelBufferGetBaseAddress(pxBuffer),
                             width: Int(outputSize.width),
                             height: Int(outputSize.height),
                             bitsPerComponent: 8,
                             bytesPerRow: CVPixelBufferGetBytesPerRow(pxBuffer),
                             space: CGColorSpaceCreateDeviceRGB(),
                             bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue) {
        UIGraphicsPushContext(ctx)
        let boxPadding: CGFloat = 12
        let text = "\(overlayTimerText)\n\(overlayPhaseText)\n\(overlayProgressText)"
        let paragraph = NSMutableParagraphStyle(); paragraph.alignment = .center
        let attrs: [NSAttributedString.Key: Any] = [
          .font: UIFont.monospacedDigitSystemFont(ofSize: fontSize, weight: .bold),
          .foregroundColor: fontColor,
          .paragraphStyle: paragraph
        ]
        let textSize = (text as NSString).boundingRect(with: CGSize(width: outputSize.width, height: outputSize.height), options: .usesLineFragmentOrigin, attributes: attrs, context: nil).size
        let boxWidth = max(textSize.width + 2 * boxPadding, 320)
        let boxHeight = textSize.height + 2 * boxPadding
        var boxY = outputSize.height - boxHeight - 80
        if position == "top-center" { boxY = 80 }
        if position == "center" { boxY = (outputSize.height - boxHeight)/2 }
        let boxRect = CGRect(x: (outputSize.width - boxWidth)/2, y: boxY, width: boxWidth, height: boxHeight)
        let path = UIBezierPath(roundedRect: boxRect, cornerRadius: borderRadius)
        backgroundColor.setFill(); path.fill()
        (text as NSString).draw(in: boxRect.insetBy(dx: boxPadding, dy: boxPadding), withAttributes: attrs)
        UIGraphicsPopContext()
      }
      CVPixelBufferUnlockBaseAddress(pxBuffer, [])

      adaptor.append(pxBuffer, withPresentationTime: time)
      return
    }

    // Audio frames
    if output == audioOutput {
      if writerStarted, let aInput = audioWriterInput, aInput.isReadyForMoreMediaData {
        aInput.append(sampleBuffer)
      }
    }
  }
}

// MARK: - Utilities
private extension UIColor {
  convenience init?(hex: String) {
    var s = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    if s.hasPrefix("#") { s.removeFirst() }
    var int = UInt64()
    Scanner(string: s).scanHexInt64(&int)
    let a, r, g, b: UInt64
    switch s.count {
      case 3: (a,r,g,b) = (255,(int>>8)*17, (int>>4 & 0xF)*17, (int & 0xF)*17)
      case 6: (a,r,g,b) = (255,int>>16, int>>8 & 0xFF, int & 0xFF)
      case 8: (a,r,g,b) = (int>>24, int>>16 & 0xFF, int>>8 & 0xFF, int & 0xFF)
      default: return nil
    }
    self.init(red: CGFloat(r)/255, green: CGFloat(g)/255, blue: CGFloat(b)/255, alpha: CGFloat(a)/255)
  }

  convenience init?(rgba: String) {
    // supports rgba(r,g,b,a) or #RRGGBB
    if rgba.contains("rgba") {
      let nums = rgba.replacingOccurrences(of: "rgba(", with: "").replacingOccurrences(of: ")", with: "").split(separator: ",")
      if nums.count == 4,
         let r = Double(nums[0].trimmingCharacters(in: .whitespaces)),
         let g = Double(nums[1].trimmingCharacters(in: .whitespaces)),
         let b = Double(nums[2].trimmingCharacters(in: .whitespaces)),
         let a = Double(nums[3].trimmingCharacters(in: .whitespaces)) {
        self.init(red: r/255, green: g/255, blue: b/255, alpha: a)
        return
      }
      return nil
    } else {
      self.init(hex: rgba)
    }
  }
}

private extension UIImage {
  func pixelBuffer() -> CVPixelBuffer? {
    let attrs: [CFString: Any] = [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true
    ]
    var pxbuffer: CVPixelBuffer?
    let width = Int(size.width)
    let height = Int(size.height)
    let status = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &pxbuffer)
    guard status == kCVReturnSuccess, let buffer = pxbuffer else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])
    guard let context = CGContext(data: CVPixelBufferGetBaseAddress(buffer),
                                  width: width,
                                  height: height,
                                  bitsPerComponent: 8,
                                  bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
                                  space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue)
    else { CVPixelBufferUnlockBaseAddress(buffer, []); return nil }

    UIGraphicsPushContext(context)
    draw(in: CGRect(x: 0, y: 0, width: size.width, height: size.height))
    UIGraphicsPopContext()

    CVPixelBufferUnlockBaseAddress(buffer, [])
    return buffer
  }
}


