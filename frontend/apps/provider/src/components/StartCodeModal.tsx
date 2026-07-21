import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, OtpInput, TestBanner, Text, useTheme } from '@chamafacil/shared';
import { useStartJob } from '../queries';

/**
 * Urgent start-code entry: a focused modal with a 4-cell code input. Owns the
 * code + the verified start mutation; on success the job query refreshes (the
 * screen flips to in_progress) and the modal closes. A wrong code shows an error.
 */
export function StartCodeModal({
  requestId,
  visible,
  onClose,
  testStartCode,
}: {
  requestId: number;
  visible: boolean;
  onClose: () => void;
  /**
   * TEMP (test bots): on a bot-generated job there is no human client to read
   * the code aloud, so the backend hands it to the accepted provider directly.
   * Shown here so the urgent start flow is actually testable. Always null on
   * real jobs. Remove with backend app/Bots.
   */
  testStartCode?: string | null;
}) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const start = useStartJob(requestId);

  const close = () => {
    setCode('');
    setError('');
    onClose();
  };

  const confirm = () => {
    setError('');
    start.mutate(code.trim(), {
      onSuccess: () => {
        setCode('');
        onClose();
      },
      onError: (e) => {
        setError((e as Error).message);
        setCode('');
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
        {/* Swallow taps on the card so they don't dismiss the modal. */}
        <Pressable onPress={() => {}}>
          <Card style={{ gap: 16 }}>
            <View style={{ gap: 4 }}>
              <Text weight="800" style={{ fontSize: 17 }}>{tr('job.startCodeTitle')}</Text>
              <Text variant="caption">{tr('job.startCodeHint')}</Text>
            </View>
            {/* TEMP — test bots. Remove with backend app/Bots. */}
            {testStartCode ? <TestBanner message={`Chamado de teste — código: ${testStartCode}`} /> : null}
            {/* The error lives inside OtpInput so it is announced with the field. */}
            <OtpInput
              value={code}
              onChange={(v) => { setError(''); setCode(v); }}
              length={4}
              label={tr('job.startCodeTitle')}
              hint={tr('otp.a11yHint', { count: 4 })}
              error={error}
            />
            <Button
              title={tr('job.confirmStart')}
              full
              disabled={code.trim().length !== 4 || start.isPending}
              loading={start.isPending}
              onPress={confirm}
            />
            <Text center weight="700" color={t.colors.ink3} style={{ fontSize: 13 }} onPress={close}>
              {tr('common.back')}
            </Text>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
