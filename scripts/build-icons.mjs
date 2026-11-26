// Renders assets/icon-src/icon.html (Readwell icon option 1d, book stack) to the app's icon PNGs with headless
// Microsoft Edge / Chrome. Run: npm run build:icons
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = pathToFileURL(join(root, 'assets', 'icon-src', 'icon.html')).href;
const out = join(root, 'assets', 'images');
mkdirSync(out, { recursive: true });

const browsers = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const browser = process.env.BROWSER_PATH || browsers.find((b) => existsSync(b));
if (!browser) throw new Error('No Edge/Chrome found; set BROWSER_PATH');

const targets = [
  ['icon.png', 'full'],
  ['android-icon-background.png', 'bg'],
  ['android-icon-foreground.png', 'fg'],
  ['android-icon-monochrome.png', 'mono'],
  ['splash-icon.png', 'splash'],
];

for (const [file, layer] of targets) {
  const dest = join(out, file);
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=00000000',
    '--window-size=1024,1024',
    `--screenshot=${dest}`,
    `${src}?layer=${layer}`,
  ]);
  console.log(`assets/images/${file}`);
}
