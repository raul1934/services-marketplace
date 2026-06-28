// Web build: there is no native speech module. Metro resolves this file on web
// so `expo-speech-recognition` is never pulled into the web bundle.
export const NativeSR: any = null;
