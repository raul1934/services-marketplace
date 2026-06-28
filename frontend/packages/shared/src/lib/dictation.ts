import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
// Platform-resolved: the real module on native (dev build), null on web/Expo Go.
import { NativeSR } from './nativeSpeech';

type Options = {
  /** BCP-47 language tag for recognition. Defaults to Brazilian Portuguese. */
  lang?: string;
  /** Called with each finalized transcript chunk. */
  onResult: (text: string) => void;
  /** Live (non-final) transcript updates — only when `interim` is enabled. */
  onPartial?: (text: string) => void;
  /** Keep listening and stream interim results (used by the dictation modal). */
  interim?: boolean;
};

/** The browser SpeechRecognition constructor, when available (web only). */
function getWebCtor(): any {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/** Whether speech-to-text is available on this platform/build. */
export function dictationSupported(): boolean {
  return !!getWebCtor() || !!NativeSR;
}

/**
 * Speech-to-text dictation.
 *  • Web   → browser Web Speech API.
 *  • Native → expo-speech-recognition (development build only).
 * On platforms/builds without support it reports `supported: false` so callers
 * can hide the affordance or fall back — no hard native dependency at runtime.
 */
export function useDictation({ lang = 'pt-BR', onResult, onPartial, interim = false }: Options) {
  const WebCtor = getWebCtor();
  const supported = !!WebCtor || !!NativeSR;
  const [listening, setListening] = useState(false);
  const webRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onPartialRef = useRef(onPartial);
  onPartialRef.current = onPartial;

  // Native event wiring (no-op when the module is absent).
  useEffect(() => {
    if (!NativeSR) return;
    const subs = [
      NativeSR.addListener('result', (e: any) => {
        const text = (e?.results?.[0]?.transcript ?? '').trim();
        if (!text) return;
        if (e?.isFinal) onResultRef.current(text);
        else onPartialRef.current?.(text);
      }),
      NativeSR.addListener('end', () => setListening(false)),
      NativeSR.addListener('error', () => setListening(false)),
    ];
    return () => subs.forEach((s) => s?.remove?.());
  }, []);

  const stop = useCallback(() => {
    if (NativeSR) {
      try {
        NativeSR.stop();
      } catch {
        /* no-op */
      }
      return;
    }
    try {
      webRef.current?.stop();
    } catch {
      /* no-op */
    }
  }, []);

  const start = useCallback(async () => {
    // ── Native (expo-speech-recognition) ─────────────────────────
    if (NativeSR) {
      try {
        const perm = await NativeSR.requestPermissionsAsync();
        if (!perm?.granted) return;
        NativeSR.start({ lang, interimResults: interim, continuous: interim, addsPunctuation: true });
        setListening(true);
      } catch {
        setListening(false);
      }
      return;
    }

    // ── Web (Web Speech API) ─────────────────────────────────────
    if (!WebCtor) return;
    try {
      webRef.current?.abort?.();
    } catch {
      /* no-op */
    }
    const rec = new WebCtor();
    rec.lang = lang;
    rec.interimResults = interim;
    rec.continuous = interim;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      let final = '';
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const seg = e.results[i];
        if (seg.isFinal) final += seg[0].transcript;
        else partial += seg[0].transcript;
      }
      if (final.trim()) onResultRef.current(final.trim());
      if (partial.trim()) onPartialRef.current?.(partial.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    webRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [WebCtor, lang, interim]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else void start();
  }, [listening, start, stop]);

  // Tear down any active recognition on unmount.
  useEffect(
    () => () => {
      try {
        if (NativeSR) NativeSR.stop();
        else webRef.current?.abort?.();
      } catch {
        /* no-op */
      }
    },
    [],
  );

  return { supported, listening, start, stop, toggle };
}
