#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TimerVideoRecorder, NSObject)

RCT_EXTERN_METHOD(startRecording:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateTimer:(NSDictionary *)config)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end 