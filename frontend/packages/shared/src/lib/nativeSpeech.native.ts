// Native builds: expose the expo-speech-recognition module when present.
// It's a native module, so it only exists in a DEVELOPMENT BUILD — in Expo Go
// the require throws (no native module), so we swallow it and report null.
let NativeSR: any = null;
try {
  NativeSR = require('expo-speech-recognition').ExpoSpeechRecognitionModule ?? null;
} catch {
  NativeSR = null;
}
export { NativeSR };
