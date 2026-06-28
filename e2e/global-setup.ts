import fs from 'fs';
import path from 'path';

// Reset the screenshot gallery before each run.
export default async function globalSetup() {
  const dir = path.join(process.cwd(), 'screens');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
