import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import * as SecureStore from 'expo-secure-store';
import { Text } from '@chamafacil/shared';
import { useUpdatePart } from '../src/queries';

import { BottomControls } from '../src/ar/components/BottomControls';
import { Crosshair } from '../src/ar/components/Crosshair';
import { LevelDot } from '../src/ar/components/LevelDot';
import { ModeToggle } from '../src/ar/components/ModeToggle';
import { ScanOverlay } from '../src/ar/components/ScanOverlay';
import { usePlaneFeedback } from '../src/ar/hooks/usePlaneFeedback';
import { useScreenshot } from '../src/ar/hooks/useScreenshot';
import { useSettled } from '../src/ar/hooks/useSettled';
import { SCAN_OVERLAY_DELAY_MS } from '../src/ar/constants';
import { LiveLength, StatusBanner } from '../src/ar/components/StatusBanner';
import { TopBar } from '../src/ar/components/TopBar';
import { Tutorial } from '../src/ar/components/Tutorial';
import { useMeasurement } from '../src/ar/hooks/useMeasurement';
import { MeasureScene } from '../src/ar/MeasureScene';
import { canConfirmPoint, hasMeasurement, isPolygon, isSnapped } from '../src/ar/rules';
import { styles } from '../src/ar/styles';

const TUTORIAL_KEY = 'chamafacil.ar.tutorialSeen';

// Viro's initialScene type is `{ scene: () => Element }`; our class component is
// runtime-compatible. This single cast is the only place the Viro type boundary needs it.
const INITIAL_SCENE = { scene: MeasureScene as unknown as () => React.JSX.Element };

/** AR measurement screen — thin composition; all logic lives in `src/ar`. */
export default function ARMedicaoScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { assetId, partId, partName } = useLocalSearchParams<{ assetId?: string; partId?: string; partName?: string }>();
  const { metrics, tracking, trackingReason, mode, appProps, confirmPoint, undo, clear, setMode } = useMeasurement();
  const [showTutorial, setShowTutorial] = useState(false);

  const partMode = !!assetId && !!partId;
  const updatePart = useUpdatePart(Number(assetId));

  const saveMeasurement = () => {
    if (!partMode) return;
    updatePart.mutate(
      { partId: Number(partId), area: metrics.area, perimeter: metrics.perimeter, points_count: metrics.count },
      { onSuccess: () => router.back() },
    );
  };

  // Show the tutorial the first time only; a "?" button reopens it later.
  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_KEY)
      .then((v) => {
        if (v !== '1') setShowTutorial(true);
      })
      .catch(() => setShowTutorial(true));
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    SecureStore.setItemAsync(TUTORIAL_KEY, '1').catch(() => {});
  };

  const title = isPolygon(metrics.count) ? `${metrics.area.toFixed(2)} m²` : `${metrics.perimeter.toFixed(2)} m`;
  const reliable = !!metrics.reticle?.reliable;

  // A surface is "locked" once the reticle sits on a real plane. That single fact
  // drives the chirp/haptic and the scanning overlay.
  const surfaceReady = reliable && tracking;
  usePlaneFeedback(surfaceReady);

  // Show the scanning overlay whenever the surface is lost — including mid-measure,
  // since that's exactly when you need to know why the reticle stopped following.
  // Gated by useSettled so the frame-to-frame tracking flicker can't strobe it.
  const scanning = useSettled(!surfaceReady, SCAN_OVERLAY_DELAY_MS);

  // Viro renders the camera and the overlay into the same surface, so one capture
  // gives you the pool with its area drawn on it — the evidence behind the quote.
  const shot = useScreenshot(partMode && partName ? `chamafacil-${partName}` : undefined);

  return (
    <View style={styles.root}>
      <ViroARSceneNavigator
        ref={shot.ref as never}
        autofocus
        initialScene={INITIAL_SCENE}
        viroAppProps={appProps}
        style={styles.ar}
      />

      <Crosshair active={!!metrics.reticle} snapped={isSnapped(metrics)} reliable={reliable} />

      <TopBar
        title={title}
        context={partMode ? partName : undefined}
        count={metrics.count}
        onBack={() => router.back()}
        onClear={clear}
        clearDisabled={!hasMeasurement(metrics.count)}
      />

      <ModeToggle mode={mode} onChange={setMode} />

      <LevelDot />

      <Pressable style={styles.shotBtn} onPress={shot.capture} accessibilityLabel={t('ar.shot')}>
        <Text style={styles.shotTxt}>{shot.state === 'saving' ? '⏳' : '📷'}</Text>
      </Pressable>
      {shot.state !== 'idle' && shot.state !== 'saving' ? (
        <View pointerEvents="none" style={styles.shotToast}>
          <Text weight="800" style={styles.shotToastTxt}>
            {t(`ar.shot_${shot.state}`)}
          </Text>
        </View>
      ) : null}

      <ScanOverlay visible={scanning} />

      {scanning ? null : (
        <StatusBanner
          crossing={metrics.crossing}
          tracking={tracking}
          trackingReason={trackingReason}
          count={metrics.count}
          mode={mode}
          reliable={reliable}
        />
      )}
      <LiveLength visible={metrics.count >= 1 && !metrics.crossing} length={metrics.liveLength} />

      <BottomControls
        onHelp={() => setShowTutorial(true)}
        onConfirm={confirmPoint}
        canConfirm={canConfirmPoint(metrics)}
        snapped={isSnapped(metrics)}
        onUndo={undo}
        undoDisabled={!hasMeasurement(metrics.count)}
      />

      {partMode && hasMeasurement(metrics.count) ? (
        <Pressable style={styles.saveBar} onPress={saveMeasurement} disabled={updatePart.isPending}>
          <Text weight="800" style={styles.saveTxt}>
            {updatePart.isPending ? '…' : t('ar.saveMeasurement', { name: partName })}
          </Text>
        </Pressable>
      ) : null}

      {showTutorial ? <Tutorial onDone={dismissTutorial} /> : null}
    </View>
  );
}
