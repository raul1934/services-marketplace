import { Platform } from 'react-native';

/**
 * Web-only tweaks that can't be expressed in RN styles:
 *  - kill the browser's default focus outline on inputs
 *  - frame the app at a phone width, centered, on wide (desktop) viewports
 * (Manrope is bundled locally via expo-font, not the CDN.) No-op on native.
 */
let done = false;
export function setupWeb() {
  if (done || Platform.OS !== 'web' || typeof document === 'undefined') return;
  done = true;

  const style = document.createElement('style');
  style.textContent = `
    input, textarea, select { outline: none !important; }
    body { background: #e7ebf0; }
    @media (min-width: 540px) {
      #root {
        max-width: 430px;
        margin: 0 auto;
        min-height: 100vh;
        background: #eef2f7;
        box-shadow: 0 0 0 1px rgba(20,35,59,.06), 0 24px 70px -24px rgba(20,35,59,.35);
      }
    }
  `;
  document.head.appendChild(style);
}
