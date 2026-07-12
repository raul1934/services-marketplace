/**
 * Generates one standalone .svg file per chamafacil kit icon into ../icons.
 * Source of truth is the ICONS map (ported in packages/shared/src/ui/Icon.tsx).
 * Each path string is split on " M" into separate <path> elements, matching
 * the runtime <Icon> renderer.
 *
 *   node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M21 21l-4.3-4.3',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0',
  back: 'M15 18l-6-6 6-6',
  fwd: 'M9 18l6-6-6-6',
  home: 'M3 10.5L12 3l9 7.5 M5 9.5V21h14V9.5',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z M3 7l9 6 9-6',
  user: 'M20 21a8 8 0 1 0-16 0 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  flash: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  calendar: 'M8 2v4M16 2v4M3 9h18 M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  camera: 'M14.5 4l1.5 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l1.5-2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  location: 'M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z M12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  navigate: 'M3 11l19-9-9 19-2-8-8-2z',
  car: 'M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11 M5 11h14v5H5z M7 16v2M17 16v2 M7.5 13.5h.01M16.5 13.5h.01',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.2L3 18v3h3l6.5-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.1-.5-.5-2.1 2.7-2.5z',
  sparkles: 'M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z',
  paw: 'M8 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 8 9z M16 9a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 16 9z M5.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M12 21c2.5 0 4.5-1.8 4.5-3.8 0-1.6-1.4-2.7-3-3.6-.8-.4-1-1-1.5-1s-.7.6-1.5 1c-1.6.9-3 2-3 3.6C7.5 19.2 9.5 21 12 21z',
  star: 'M12 3l2.5 5.5L20.5 9l-4.5 4 1.2 6L12 16l-5.2 3 1.2-6L3.5 9l6-0.5L12 3z',
  power: 'M12 4v8 M7.5 7.5a7 7 0 1 0 9 0',
  check: 'M5 13l4 4L19 7',
  clock: 'M12 7v5l3 2 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z M9 12l2 2 4-4',
  phone: 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L17 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  chat: 'M21 11.5a8 8 0 0 1-11.5 7.2L3 21l2.3-6.5A8 8 0 1 1 21 11.5z',
  grip: 'M5 9h14M5 15h14',
  filter: 'M3 5h18l-7 8v6l-4-2v-4L3 5z',
  battery: 'M3 8h14v8H3z M20 11v2 M7 9l-1.5 3H8l-1 3',
  key: 'M14 7a4 4 0 1 1-3.5 6L7 16.5 5 18l-2-.5L3 15l.5-2L10.5 10A4 4 0 0 1 14 7z',
  briefcase: 'M4 8h16v11H4z M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 13h16',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19 12l1.5 1-1 2.5-1.8-.3a6.7 6.7 0 0 1-1.5.9L15 18h-3l-.3-1.9a6.7 6.7 0 0 1-1.5-.9l-1.8.3-1-2.5L8 12l-1.5-1 1-2.5 1.8.3a6.7 6.7 0 0 1 1.5-.9L12 6h3l.3 1.9a6.7 6.7 0 0 1 1.5.9l1.8-.3 1 2.5z',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  shieldCheck: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  pin: 'M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11z',
  dollar: 'M12 2v20 M16 6.5C16 5 14.5 4 12.5 4S9 5 9 6.8c0 3.7 7 2.2 7 5.7 0 1.8-1.6 2.8-3.6 2.8S8 14.2 8 12.7',
  edit: 'M16 3l5 5L8 21H3v-5L16 3z',
  heart: 'M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20z',
  wifi: 'M5 12.5a10 10 0 0 1 14 0 M8 15.5a6 6 0 0 1 8 0 M12 19h.01',
  truck: 'M3 6h11v9H3z M14 9h4l3 3v3h-7 M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M17.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  scissors: 'M6 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M6 13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M8.2 9.5L20 18 M8.2 14.5L20 6',
  close: 'M6 6l12 12M18 6L6 18',
  chevronsR: 'M5 17l5-5-5-5 M12 17l5-5-5-5',
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'icons');
mkdirSync(outDir, { recursive: true });

const svgFor = (d) => {
  const paths = d
    .split(' M')
    .map((seg, i) => (i ? 'M' + seg : seg))
    .map((seg) => `  <path d="${seg}" />`)
    .join('\n');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"',
    '     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    paths,
    '</svg>',
    '',
  ].join('\n');
};

let count = 0;
for (const [name, d] of Object.entries(ICONS)) {
  writeFileSync(resolve(outDir, `${name}.svg`), svgFor(d), 'utf8');
  count++;
}

// Filled variants (<name>-fill.svg) for the icons the design renders solid.
const svgFilled = (d) => {
  const paths = d
    .split(' M')
    .map((seg, i) => (i ? 'M' + seg : seg))
    .map((seg) => `  <path d="${seg}" />`)
    .join('\n');
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"',
    '     fill="currentColor" stroke="none">',
    paths,
    '</svg>',
    '',
  ].join('\n');
};

const FILLED = ['star', 'sparkles', 'pin', 'flash', 'navigate', 'heart'];
for (const name of FILLED) {
  writeFileSync(resolve(outDir, `${name}-fill.svg`), svgFilled(ICONS[name]), 'utf8');
  count++;
}

console.log(`Wrote ${count} icons to ${outDir}`);
