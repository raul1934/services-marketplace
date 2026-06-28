import fs from 'fs';
import path from 'path';

// Build screens/SCREENS.md from the per-step manifest written during the run.
export default async function globalTeardown() {
  const dir = path.join(process.cwd(), 'screens');
  const manifest = path.join(dir, 'manifest.jsonl');
  if (!fs.existsSync(manifest)) return;

  const rows = fs
    .readFileSync(manifest, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { journey: string; order: number; file: string; path: string; step: string });

  const order: string[] = [];
  const byJourney: Record<string, typeof rows> = {};
  for (const r of rows) {
    if (!byJourney[r.journey]) { byJourney[r.journey] = []; order.push(r.journey); }
    byJourney[r.journey].push(r);
  }

  let md = `# Journey screenshots\n\n`;
  md += `${rows.length} screenshots across ${order.length} flows, captured per step during \`npx playwright test --project=journeys\`. Paths are relative to \`e2e/\`.\n\n`;
  md += `| # | Flow (test) | Step | Screenshot | Path |\n|---|---|---|---|---|\n`;
  let n = 0;
  for (const j of order) {
    for (const r of byJourney[j]) {
      n++;
      md += `| ${n} | ${j} | ${r.step} | ${r.file} | \`${r.path}\` |\n`;
    }
  }
  md += `\n`;
  for (const j of order) {
    md += `## ${j}\n\n`;
    for (const r of byJourney[j]) {
      md += `### ${r.order}. ${r.step}\n\n`;
      md += `\`${r.path}\`\n\n`;
      md += `![${j} — ${r.step}](${path.relative(dir, path.join(process.cwd(), r.path)).replace(/\\/g, '/')})\n\n`;
    }
  }
  fs.writeFileSync(path.join(dir, 'SCREENS.md'), md);
  // eslint-disable-next-line no-console
  console.log(`\nSCREENS.md written: ${rows.length} screenshots → e2e/screens/SCREENS.md`);
}
