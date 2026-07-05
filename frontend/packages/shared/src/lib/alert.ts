import { Alert as RNAlert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// react-native-web's Alert.alert() is a hard no-op — no window.alert, no
// rendering, nothing — so every error message and destructive-action
// confirmation in the web build silently vanishes (a tap looks like it did
// nothing at all). This drop-in replacement keeps the same call signature and
// falls back to window.alert/confirm on web; native platforms are untouched.
function alert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons);
    return;
  }
  const text = [title, message].filter(Boolean).join('\n\n');
  const cancelBtn = buttons?.find((b) => b.style === 'cancel');
  const actionBtn = buttons?.find((b) => b !== cancelBtn);
  if (buttons && buttons.length > 1 && actionBtn) {
    if (window.confirm(text)) actionBtn.onPress?.();
    else cancelBtn?.onPress?.();
    return;
  }
  window.alert(text);
  buttons?.[0]?.onPress?.();
}

export const Alert = { alert };
