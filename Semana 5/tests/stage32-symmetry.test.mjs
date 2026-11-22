import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('Etapa 32 añade bloques de simetría para móvil, tablet y desktop intermedio', () => {
  const base = src('styles/base.css');
  const mobile = src('styles/responsive/mobile.css');
  const tablet = src('styles/responsive/tablet.css');
  const desktop = src('styles/responsive/desktop.css');

  assert.match(base, /Etapa 32 · ritmo y simetría global/);
  assert.match(base, /\.review-actions > \*,/);
  assert.match(base, /\.previous-voucher > \*,/);

  assert.match(mobile, /Etapa 32 · simetría móvil/);
  assert.match(mobile, /\.trip-review-page\{display:grid;gap:18px/);
  assert.match(mobile, /\.catalog-toolbar,\n  \.results-bar\{grid-template-columns:1fr;display:grid/);

  assert.match(tablet, /Etapa 32 · simetría tablet/);
  assert.match(tablet, /\.trip-review-page\{display:grid;gap:20px/);
  assert.match(tablet, /\.catalog-toolbar\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);

  assert.match(desktop, /Etapa 32 · simetría desktop intermedio/);
  assert.match(desktop, /\.trip-review-page\{width:min\(100%,980px\);display:grid;gap:22px/);
});
