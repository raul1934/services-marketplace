/** ViroReact materials for the AR measurement, registered once on import. */

import { ViroMaterials } from '@reactvision/react-viro';

export const Material = {
  Point: 'ar_point',
  Snap: 'ar_snap',
  Reticle: 'ar_reticle',
  Line: 'ar_line',
  Preview: 'ar_preview',
  Fill: 'ar_fill',
} as const;

// `Constant` lighting keeps the markers/lines at full colour regardless of scene
// lighting, so they read clearly over the camera feed.
ViroMaterials.createMaterials({
  [Material.Point]: { lightingModel: 'Constant', diffuseColor: '#ff6a3d' },
  [Material.Snap]: { lightingModel: 'Constant', diffuseColor: '#2bd576' },
  [Material.Reticle]: { lightingModel: 'Constant', diffuseColor: '#ffffff' },
  [Material.Line]: { lightingModel: 'Constant', diffuseColor: '#ff6a3d' },
  [Material.Preview]: { lightingModel: 'Constant', diffuseColor: '#ff8a4c' },
  [Material.Fill]: { lightingModel: 'Constant', diffuseColor: '#ffd0b0' },
});
