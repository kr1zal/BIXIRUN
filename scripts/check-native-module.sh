#!/usr/bin/env bash
set -euo pipefail

swift_file="ios/BIXIRUN/TimerVideoRecorder.swift"
objc_file="ios/BIXIRUN/TimerVideoRecorder.m"
pbxproj="ios/BIXIRUN.xcodeproj/project.pbxproj"

for f in "$swift_file" "$objc_file" "$pbxproj"; do
  if [ ! -f "$f" ]; then
    echo "[check-native-module] Missing $f" >&2
    exit 1
  fi
done

if ! grep -q "TimerVideoRecorder.swift" "$pbxproj"; then
  echo "[check-native-module] Swift file is not referenced in Xcode project" >&2
  exit 1
fi

if ! grep -q "TimerVideoRecorder.m in Sources" "$pbxproj"; then
  echo "[check-native-module] ObjC bridge is not in Sources build phase" >&2
  exit 1
fi

echo "[check-native-module] OK"


