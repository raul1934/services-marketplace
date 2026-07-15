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
import { ModeToggle } from '../src/ar/components/ModeToggle';
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
const INITIAL_SCENE = { scene: MeasureScene as unknown as () => JSX.Element };

/** AR measurement screen — thin composition; all logic lives in `src/ar`. */
export default function ARMedicaoScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { assetId, partId, partName } = useLocalSearchParams<{ assetId?: string; partId?: string; partName?: string }>();
  const { metrics, tracking, trackingReason, lineMode, mode, appProps, confirmPoint, undo, clear, toggleLine, setMode } = useMeasurement();
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

  return (
    <View style={styles.root}>
      <ViroARSceneNavigator autofocus initialScene={INITIAL_SCENE} viroAppProps={appProps} style={styles.ar} />

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

      <StatusBanner
        crossing={metrics.crossing}
        tracking={tracking}
        trackingReason={trackingReason}
        count={metrics.count}
        mode={mode}
        reliable={reliable}
      />
      <LiveLength visible={lineMode && metrics.count >= 1 && !metrics.crossing} length={metrics.liveLength} />

      <BottomControls
        lineMode={lineMode}
        onToggleLine={toggleLine}
        onConfirm={confirmPoint}
        canConfirm={canConfirmPoint(metrics)}
        snapped={isSnapped(metrics)}
        onUndo={undo}
        undoDisabled={!hasMeasurement(metrics.count)}
      />

      <Pressable style={styles.helpBtn} onPress={() => setShowTutorial(true)} accessibilityLabel={t('ar.help')}>
        <Text weight="800" style={styles.helpTxt}>?</Text>
      </Pressable>

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
