#!/usr/bin/env sh
# Runs inside the chamafacil-android-build container. Prebuilds the selected Expo app
# and produces a dev-client debug APK in /out. Mounted at runtime (not baked) so
# it can be edited without rebuilding the image.
set -eux

APP="${APP:-customer}"
cd "/app/apps/$APP"

npx expo prebuild --platform android --no-install

# expo-modules-core (SDK 52) picks its Compose Compiler from rootProject.ext.kotlinVersion.
# Expo's template leaves that at 1.9.25 → Compose 1.5.15, but React Native 0.76's actual
# Kotlin compiler is 1.9.24, so compileDebugKotlin fails. Pin it to 1.9.24 → Compose 1.5.14.
# Appended after the buildscript{} block (already evaluated), so only the module-level
# Compose selection changes; the compiler classpath is untouched.
printf '\nrootProject.ext.kotlinVersion = "1.9.24"\n' >> android/build.gradle

cd android
# Only build the ABI(s) you actually run on. arm64-v8a covers virtually every
# modern physical Android device; building all four (armeabi-v7a/x86/x86_64 too)
# roughly quadruples the slow native C++ step. Override with ABIS=... if needed.
ABIS="${ABIS:-arm64-v8a}"
./gradlew assembleDebug -PreactNativeArchitectures="$ABIS" --no-daemon

mkdir -p /out
cp app/build/outputs/apk/debug/app-debug.apk "/out/chamafacil-$APP-debug.apk"
echo "APK ready -> build-output/chamafacil-$APP-debug.apk"
