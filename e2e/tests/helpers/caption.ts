import { Page } from '@playwright/test';

/**
 * On-page caption banner for demo recordings. The banner is real DOM injected
 * into the app page, so Playwright's video recorder captures it — the saved
 * .webm already carries the narration. It floats just above the footer CTA
 * (not at the very bottom) so it never hides the slide-to-confirm control.
 *
 * Navigations wipe the DOM; attachCaptions() re-applies the current text on
 * every document load so a caption set before a `go()` survives it.
 */

const CURRENT = new WeakMap<Page, string>();

async function apply(page: Page, text: string) {
  await page
    .evaluate((t) => {
      let el = document.getElementById('e2e-caption') as HTMLDivElement | null;
      if (!el) {
        // The text is rendered by a ::after pseudo-element reading an
        // attribute, so it shows on screen (and in the video) but is invisible
        // to Playwright text locators — captions can't collide with the
        // getByText selectors driving the flow.
        const style = document.createElement('style');
        style.textContent = '#e2e-caption::after{content:attr(data-caption);white-space:pre-line;}';
        document.head.appendChild(style);
        el = document.createElement('div');
        el.id = 'e2e-caption';
        // Full-width bar above the footer CTA; height grows with the text.
        Object.assign(el.style, {
          position: 'fixed',
          left: '0',
          right: '0',
          bottom: '96px',
          zIndex: '2147483647',
          padding: '10px 18px',
          background: 'rgba(10,12,18,0.82)',
          color: '#fff',
          font: '600 14.5px/1.4 system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          pointerEvents: 'none',
        } as Partial<CSSStyleDeclaration>);
        document.body.appendChild(el);
      }
      el.setAttribute('data-caption', t);
    }, text)
    .catch(() => {
      /* page mid-navigation — the domcontentloaded hook re-applies */
    });
}

/** Call once per page right after creating it. */
export function attachCaptions(page: Page) {
  page.on('domcontentloaded', () => {
    const t = CURRENT.get(page);
    if (t) void apply(page, t);
  });
}

/** Show (or replace) the caption on a page. */
export async function caption(page: Page, text: string) {
  CURRENT.set(page, text);
  await apply(page, text);
}

// ── SRT sidecar ──────────────────────────────────────────────────────────────
// One tracker per journey, shared by both apps' pages so the timestamps line
// up with either video for later editing.

export interface CueTracker {
  mark(text: string): void;
  toSrt(): string;
}

const TAIL_MS = 8_000; // how long the last cue stays on screen

export function cueTracker(): CueTracker {
  const start = Date.now();
  const cues: { at: number; text: string }[] = [];

  const ts = (ms: number) => {
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor(ms / 60_000) % 60;
    const s = Math.floor(ms / 1_000) % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`;
  };

  return {
    mark(text) {
      cues.push({ at: Date.now() - start, text });
    },
    toSrt() {
      return cues
        .map((c, i) => {
          const end = i + 1 < cues.length ? cues[i + 1].at : c.at + TAIL_MS;
          return `${i + 1}\n${ts(c.at)} --> ${ts(end)}\n${c.text}\n`;
        })
        .join('\n');
    },
  };
}
