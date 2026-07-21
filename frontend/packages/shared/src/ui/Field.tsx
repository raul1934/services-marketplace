import React, { useRef, useState } from 'react';
import { Platform, Pressable, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme';
import { dictationSupported } from '../lib/dictation';
import { DictationModal } from './DictationModal';
import { Icon } from './Icon';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  right?: React.ReactNode;
  /** Show a microphone button that dictates speech into the field (web). */
  voiceInput?: boolean;
}

export function Field({ label, error, hint, right, voiceInput, style, ...rest }: Props) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Append confirmed dictation to whatever the field already holds.
  const applyDictation = (text: string) => {
    if (!text) return;
    const cur = typeof rest.value === 'string' ? rest.value : '';
    const sep = cur && !/\s$/.test(cur) ? ' ' : '';
    rest.onChangeText?.(cur + sep + text);
  };

  // Web/dev-build: tapping the mic opens the dictation modal. Where STT isn't
  // available (Expo Go on native) the mic focuses the field so the on-screen
  // keyboard's own voice-typing (e.g. Gboard) can be used instead.
  const supported = dictationSupported();
  const native = Platform.OS !== 'web';
  const showMic = !!voiceInput && (supported || native);
  const onMic = () => (supported ? setVoiceOpen(true) : inputRef.current?.focus());
  return (
    <View style={{ gap: 6 }}>
      {label && <Text variant="label">{label}</Text>}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: t.colors.surface2,
          borderRadius: t.radius.field,
          borderWidth: 1.5,
          borderColor: error ? t.colors.danger : focused ? t.colors.accent : t.colors.line,
          paddingHorizontal: 14,
          minHeight: 50,
        }}
      >
        <TextInput
          ref={inputRef}
          // The visible label is the field's name, and the error (or hint) is its
          // description — otherwise a screen reader lands on an unnamed box and
          // the red text below is just loose prose it may never reach.
          accessibilityLabel={rest.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          aria-invalid={!!error}
          placeholderTextColor={t.colors.ink3}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            { flex: 1, fontSize: 15, color: t.colors.ink, paddingVertical: 12, fontWeight: '500' },
            style,
          ]}
          {...rest}
        />
        {showMic && (
          <Pressable
            onPress={onMic}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ditar por voz"
            style={{
              paddingLeft: 8,
              alignSelf: rest.multiline ? 'flex-start' : 'center',
              paddingTop: rest.multiline ? 12 : 0,
            }}
          >
            <Icon name="mic" size={20} color={t.colors.ink3} />
          </Pressable>
        )}
        {right}
      </View>
      {error ? (
        // Assertive: a rejected field is the reason the form did not submit, so
        // it should interrupt rather than wait to be discovered.
        <Text variant="caption" color={t.colors.danger} accessibilityLiveRegion="assertive" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption">{hint}</Text>
      ) : null}

      {showMic && supported && (
        <DictationModal
          visible={voiceOpen}
          onClose={() => setVoiceOpen(false)}
          onConfirm={(text) => {
            applyDictation(text);
            setVoiceOpen(false);
          }}
        />
      )}
    </View>
  );
}
