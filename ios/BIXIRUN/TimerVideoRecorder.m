// TimerVideoRecorder.m
#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

// Expose Swift class to React Native
@interface RCT_EXTERN_MODULE(TimerVideoRecorder, NSObject)

RCT_EXTERN_METHOD(startRecording:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateTimer:(NSDictionary *)config)

RCT_EXTERN_METHOD(stopRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(switchCamera:(NSString *)cameraPosition
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(isRecording:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end


