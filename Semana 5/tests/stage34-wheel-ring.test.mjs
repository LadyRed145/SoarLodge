import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('La antena desaparece de PC y tablet, sin borrar el aro punteado de la noria', () => {
  const base = read('styles/base.css');
  const desktop = read('styles/responsive/desktop.css');
  const tablet = read('styles/responsive/tablet.css');
  const markup = read('pages/Catalog.jsx');

  // La curva extra venía de este pseudo-elemento GLOBAL, no de la noria.
  assert.doesNotMatch(base, /\.catalog-heading::?before\s*\{/);

  // El anillo completo es un elemento diferente y debe seguir visible.
  assert.match(base, /\.catalog-heading__ring\{[^}]*border:2px dashed #ffffffc4/);
  assert.match(base, /\.catalog-heading__ring::after\{content:""/);
  assert.match(base, /\.catalog-heading__ring--inner\{inset:34px;border-style:solid/);
  assert.match(markup, /catalog-heading__ring catalog-heading__ring--inner/);
  assert.match(markup, /<CatalogFerrisWheel \/>/);

  // Ningún ajuste de PC o tablet debe ocultar el aro exterior otra vez.
  for (const css of [desktop, tablet]) {
    assert.doesNotMatch(css, /\.catalog-heading__ring[^\n{}]*\{[^}]*border-color\s*:\s*transparent/);
    assert.doesNotMatch(css, /\.catalog-heading__ring[^\n{}]*\{[^}]*display\s*:\s*none/);
  }
});

test('Las reglas de diseño por dispositivo conservan los demás arreglos anteriores', () => {
  const desktop = read('styles/responsive/desktop.css');
  const mobile = read('styles/responsive/mobile.css');
  const tablet = read('styles/responsive/tablet.css');
  assert.match(desktop, /@media \(min-width:1025px\) and \(max-width:1280px\)/);
  assert.match(mobile, /\.trip-review-page>\.trip-route-banner\{margin-top:240px\}/);
  assert.match(tablet, /@media \(min-width:761px\) and \(max-width:1024px\)/);
});
