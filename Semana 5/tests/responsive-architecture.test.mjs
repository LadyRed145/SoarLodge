import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { readStyles } from './read-styles.mjs';

const src = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const modules = [
  'styles/tokens.css', 'styles/base.css', 'styles/responsive/compact.css',
  'styles/responsive/desktop.css', 'styles/responsive/tablet.css',
  'styles/responsive/mobile.css', 'styles/accessibility.css',
];

test('Entrada CSS importa cada módulo una sola vez, sin copiar estilos por dispositivo', () => {
  const entry = src('styles.css');
  const listed = [...entry.matchAll(/@import '\.\/(styles\/[^']+\.css)';/g)].map(match => match[1]);
  assert.deepEqual(listed, modules);
  for (const module of modules) {
    assert.ok(existsSync(new URL(`../src/${module}`, import.meta.url)));
    assert.doesNotMatch(src(module), /@import\s/);
  }
  assert.doesNotMatch(src('styles/base.css'), /@media\s*\(.*(?:max|min)-width/);
  assert.match(readStyles(), /\.page-atmosphere--trip/);
  assert.match(readStyles(), /\.catalog-ferris-wheel__rotor/);
});

test('Móvil y tablet abren navegación EN FLUJO, nunca encima del avión', () => {
  const layout = src('components/SiteLayout.jsx');
  assert.match(layout, /aria-expanded=\{open\}/);
  assert.match(layout, /aria-controls="site-navigation"/);
  assert.match(layout, /className=\{`primary-nav \$\{open\?'is-open'/);
  for (const name of ['mobile', 'tablet']) {
    const css = src(`styles/responsive/${name}.css`);
    assert.match(css, /\.header-inner\{flex-wrap:wrap/);
    assert.match(css, /\.header-inner>\.primary-nav\{position:static;inset:auto/);
    assert.match(css, /\.header-inner>\.primary-nav\.is-open\{display:flex/);
    assert.match(css, /flex:0 0 100%/);
  }
});

test('Mobile, tablet y desktop tienen límites no contradictorios', () => {
  const mobile = src('styles/responsive/mobile.css');
  const tablet = src('styles/responsive/tablet.css');
  const desktop = src('styles/responsive/desktop.css');
  const compact = src('styles/responsive/compact.css');
  assert.match(mobile, /@media\(max-width:760px\)/);
  assert.match(tablet, /@media \(min-width:761px\) and \(max-width:1024px\)/);
  assert.match(desktop, /@media \(min-width:1025px\) and \(max-width:1100px\)/);
  assert.match(compact, /@media\(max-width:1100px\)/);
  assert.doesNotMatch(mobile, /min-width:761px/);
  assert.doesNotMatch(tablet, /max-width:760px/);
});

test('Fondos, impresión y reducción de movimiento se mantienen', () => {
  const accessibility = src('styles/accessibility.css');
  assert.match(accessibility, /prefers-reduced-motion:reduce/);
  assert.match(accessibility, /@media print/);
  assert.match(accessibility, /\.trip-sky__plane/);
  assert.match(accessibility, /\.page-atmosphere/);
  assert.match(accessibility, /\.checkout-moving-walkway/);
});
