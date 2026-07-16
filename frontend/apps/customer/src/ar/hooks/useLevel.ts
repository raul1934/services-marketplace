import { useEffect, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';
import { LEVEL_TOLERANCE_DEG, LEVEL_UPDATE_MS } from '../constants';

export interface LevelState {
  /** Left/right tilt (roll) in degrees. 0 = upright. */
  roll: number;
  /** True while the roll is within tolerance. */
  level: boolean;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Left/right tilt (roll) from DeviceMotion, for the on-screen level dot.
 *
 * Uses DeviceMotion — NOT the raw gyroscope: a gyroscope measures angular
 * *velocity* and drifts, so it can't tell where "down" is. DeviceMotion fuses the
 * accelerometer (gravity) with the gyro and reports absolute orientation, which is
 * what a level needs. `rotation.gamma` is the left/right axis.
 */
export function useLevel(toleranceDeg: number = LEVEL_TOLERANCE_DEG): LevelState {
  const [roll, setRoll] = useState(0);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    let active = true;

    DeviceMotion.isAvailableAsync()
      .then((ok) => {
        if (!ok || !active) return;
        DeviceMotion.setUpdateInterval(LEVEL_UPDATE_MS);
        sub = DeviceMotion.addListener(({ rotation }) => {
          if (rotation) setRoll(rotation.gamma * RAD_TO_DEG);
        });
      })
      .catch(() => {
        // Sensor unavailable — the dot simply stays at 0 (level).
      });

    return () => {
      active = false;
      sub?.remove();
    };
  }, []);

  return { roll, level: Math.abs(roll) <= toleranceDeg };
}
