export interface TimerVideoRecorderConfig {
    timerText: string;
    phaseText: string;
    progressText: string;
    progressRatio?: number; // 0..1 — для отрисовки кольца прогресса в нативном видео
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    position?: 'top-center' | 'bottom-center' | 'center';
    cameraPosition?: 'front' | 'back';
    videoOrientation?: 'portrait' | 'landscape';
    useReplayKit?: boolean; // по умолчанию true; если false — пишем только камеру + оверлей (без UI)
}

export interface TimerUpdateConfig {
    timerText: string;
    phaseText?: string;
    progressText?: string;
    progressRatio?: number; // 0..1
}

export interface TimerVideoRecorderPermissions {
    camera: boolean;
    microphone: boolean;
}

export interface TimerVideoRecorderResult {
    status: 'success' | 'saved_locally' | 'error';
    videoPath?: string;
    message?: string;
}

export interface TimerVideoRecorderModule {
    startRecording(config: TimerVideoRecorderConfig): Promise<{ status: string; message: string }>;
    updateTimer(config: { timerText: string; phaseText?: string; progressText?: string }): void;
    stopRecording(): Promise<TimerVideoRecorderResult>;
    isRecording?(): Promise<{ recording: boolean }>;
    switchCamera(cameraPosition: 'front' | 'back'): Promise<{ status: string; camera: string }>;
}

declare module 'react-native' {
    interface NativeModulesStatic {
        TimerVideoRecorder: TimerVideoRecorderModule;
    }
} 