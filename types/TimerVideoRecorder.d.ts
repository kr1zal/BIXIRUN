export interface TimerVideoRecorderConfig {
    timerText: string;
    phaseText: string;
    progressText: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    position?: 'top-center' | 'bottom-center' | 'center';
    cameraPosition?: 'front' | 'back';
    videoOrientation?: 'portrait' | 'landscape';
}

export interface TimerUpdateConfig {
    timerText: string;
    phaseText?: string;
    progressText?: string;
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
    switchCamera(cameraPosition: 'front' | 'back'): Promise<{ status: string; camera: string }>;
}

declare module 'react-native' {
    interface NativeModulesStatic {
        TimerVideoRecorder: TimerVideoRecorderModule;
    }
} 