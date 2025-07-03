declare module 'react-native' {
    interface NativeModulesStatic {
        TimerVideoRecorder: {
            startRecording(config: {
                timerText: string;
                phaseText?: string;
                progressText?: string;
                fontSize?: number;
                fontColor?: string;
                backgroundColor?: string;
                borderRadius?: number;
                position?: 'top-center' | 'bottom-center';
            }): Promise<string>;

            updateTimer(config: {
                timerText: string;
                phaseText?: string;
                progressText?: string;
            }): void;

            stopRecording(): Promise<string>;
        };
    }
}

export interface TimerVideoRecorderConfig {
    timerText: string;
    phaseText?: string;
    progressText?: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    borderRadius?: number;
    position?: 'top-center' | 'bottom-center';
}

export interface TimerUpdateConfig {
    timerText: string;
    phaseText?: string;
    progressText?: string;
} 