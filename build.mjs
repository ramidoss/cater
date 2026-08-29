/* Inlines the sources into single self-contained pages.
 * Artifacts allow no external CSS or fetches, so everything ships in one file. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

const targets = [
  {
    template: 'src/prototype.html',
    out: 'dist/north-prototype.html',
    styles: ['src/tokens.css', 'src/ui.css'],
    scripts: [
      'src/data.js', 'src/model.js', 'src/charts.js', 'src/chart-line.js',
      'src/chart-bars.js', 'src/metric-cards.js', 'src/app.js',
      'src/app-views.js', 'src/app-investigation.js', 'src/app-shell.js'
    ]
  },
  {
    template: 'src/exploration.html',
    out: 'dist/north-metric-system.html',
    styles: ['src/tokens.css', 'src/ui.css', 'src/exploration.css'],
    scripts: [
      'src/data.js', 'src/model.js', 'src/charts.js', 'src/chart-line.js',
      'src/chart-bars.js', 'src/metric-cards.js', 'src/exploration.js'
    ]
  }
];

mkdirSync(new URL('dist/', import.meta.url), { recursive: true });

for (const t of targets) {
  let html;
  try { html = read(t.template); } catch { console.log('skip ' + t.out + ' (no template yet)'); continue; }
  const css = t.styles.map(read).join('\n');
  const js = t.scripts.map(read).join('\n');
  html = html.replace('/*STYLES*/', () => css).replace('/*SCRIPTS*/', () => js);
  writeFileSync(new URL(t.out, import.meta.url), html);
  console.log(t.out + '  ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
}
