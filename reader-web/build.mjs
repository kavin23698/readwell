// Builds the three offline reader pages (assets/reader/{epub,pdf,txt}.html) by inlining the
// libraries, the Nunito font and our reader scripts. Run: npm run build:reader
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const nm = (p) => join(root, 'node_modules', p);
const read = (p) => readFileSync(p, 'utf8');
const outDir = join(root, 'assets', 'reader');
mkdirSync(outDir, { recursive: true });

/** Makes inlined code safe inside <script>. */
const safe = (code) => code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

// Nunito (500 body, 800 headings) embedded so reading works offline.
const font = (file, weight) => {
  const b64 = readFileSync(nm(`@expo-google-fonts/nunito/${file}`)).toString('base64');
  return `@font-face{font-family:'Nunito';font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
};
const fontCss = font('500Medium/Nunito_500Medium.ttf', '400 600') + font('800ExtraBold/Nunito_800ExtraBold.ttf', '700 900');

const head = (title, css) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>${title}</title>
<style>${fontCss}${css}</style>
<script>window.RW_FONT_CSS=${JSON.stringify(fontCss)};</script>
</head>`;

const base = read(join(here, 'base.css'));
const common = read(join(here, 'common.js'));

// ---------------------------------------------------------------- EPUB
const epubHtml = `${head('Readwell EPUB', base + '#viewer{position:fixed;top:var(--pad-top);bottom:var(--pad-bottom);left:22px;right:22px}')}
<body><div class="rw-loading">Opening…</div><div id="viewer"></div>
<script>${safe(read(nm('jszip/dist/jszip.min.js')))}</script>
<script>${safe(read(nm('epubjs/dist/epub.min.js')))}</script>
<script>${safe(common)}</script>
<script>${safe(read(join(here, 'epub-app.js')))}</script>
</body></html>`;

// ---------------------------------------------------------------- TXT
const txtHtml = `${head('Readwell TXT', base)}
<body><div class="rw-loading">Opening…</div>
<script>${safe(common)}</script>
<script>${safe(read(join(here, 'txt-app.js')))}</script>
</body></html>`;

// ---------------------------------------------------------------- PDF
let pdfLib = read(nm('pdfjs-dist/build/pdf.min.mjs'));
const exp = /export\s*\{([^}]*)\};?\s*(\/\/#\s*sourceMappingURL=\S+\s*)?$/.exec(pdfLib);
if (!exp) throw new Error('pdf.min.mjs: export list not found');
const mapping = exp[1]
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [local, , exported] = s.split(/\s+/);
    return `${JSON.stringify(exported ?? local)}:${local}`;
  })
  .join(',');
pdfLib = pdfLib.slice(0, exp.index) + `globalThis.pdfjsLib={${mapping}};`;
const pdfWorker = read(nm('pdfjs-dist/build/pdf.worker.min.mjs')).replace(/\/\/#\s*sourceMappingURL=\S+\s*$/, '');

const pdfHtml = `${head('Readwell PDF', base + read(join(here, 'pdf.css')))}
<body><div class="rw-loading">Opening…</div>
<script type="text/plain" id="pdf-worker">${safe(pdfWorker)}</script>
<script>${safe(common)}</script>
<script type="module">${safe(pdfLib)}</script>
<script type="module">${safe(read(join(here, 'pdf-app.js')))}</script>
</body></html>`;

for (const [name, html] of [
  ['epub.html', epubHtml],
  ['txt.html', txtHtml],
  ['pdf.html', pdfHtml],
]) {
  writeFileSync(join(outDir, name), html);
  console.log(`assets/reader/${name}  ${(html.length / 1024).toFixed(0)} KB`);
}
