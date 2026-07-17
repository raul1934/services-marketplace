import { useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

/** What Viro's takeScreenshot resolves with. */
interface ShotResult {
  success: boolean;
  url?: string;
  errorCode?: number;
}

/** The subset of the Viro navigator ref we call. */
export interface ViroNavigatorRef {
  _takeScreenshot?: (fileName: string, saveToCameraRoll: boolean) => Promise<ShotResult>;
}

export type ShotState = 'idle' | 'saving' | 'saved' | 'failed';

/**
 * Captures the AR view — camera feed *and* the 3D measurement overlay, since Viro
 * renders both into one surface — to the app's own storage. That image is the
 * evidence behind a quote: the wall, with its metres drawn on it.
 *
 * Photos stay on the device while you measure and only reach the database when
 * the measurement is saved, so an abandoned session leaves nothing behind. We
 * pass saveToCameraRoll=false: Viro's camera-roll path writes via legacy
 * WRITE_EXTERNAL_STORAGE, which Android 13+ no longer grants, and the gallery
 * isn't where these belong anyway.
 */
export function useScreenshot(prefix = 'chamafacil-medicao') {
  const ref = useRef<ViroNavigatorRef | null>(null);
  const [state, setState] = useState<ShotState>('idle');
  const [photos, setPhotos] = useState<string[]>([]);

  const settle = (next: ShotState) => {
    setState(next);
    setTimeout(() => setState('idle'), 2200);
  };

  const capture = async (): Promise<string | undefined> => {
    if (state === 'saving') return;
    setState('saving');
    try {
      // Viro derives the extension; a timestamp keeps successive shots distinct.
      const res = await ref.current?._takeScreenshot?.(`${prefix}-${Date.now()}`, false);
      if (!res?.success || !res.url) {
        settle('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      // Viro returns a bare path; everything downstream (Image, upload) wants a URI.
      const uri = res.url.startsWith('file://') ? res.url : `file://${res.url}`;
      setPhotos((prev) => [...prev, uri]);
      settle('saved');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return uri;
    } catch {
      settle('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return undefined;
    }
  };

  const discard = (uri: string) => setPhotos((prev) => prev.filter((p) => p !== uri));

  return { ref, state, capture, photos, discard };
}
