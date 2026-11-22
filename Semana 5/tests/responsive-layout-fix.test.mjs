import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readStyles();
const home = readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../src/pages/Catalog.jsx', import.meta.url), 'utf8');

test('Inicio móvil reserva el alto de la búsqueda antes del encabezado siguiente', () => {
  assert.match(home, /className="layout-width hero-search-shell"/);
  assert.match(home, /className="section explore-strip layout-width"/);
  assert.match(css, /ETAPA 28 · Geometría móvil sin solapamientos/);
  assert.match(css, /\.section\.explore-strip\{padding-top:clamp\(130px,29vw,160px\)\}/);
  assert.match(css, /@media\(max-width:400px\)\{\s*\.section\.explore-strip\{padding-top:135px\}/);
  assert.match(css, /\.hero-search-shell\{margin-top:22px\}/);
});

test('Destinos móvil ubica la noria debajo del texto sin recortarla', () => {
  assert.match(catalog, /className="catalog-heading__ornament"/);
  assert.match(catalog, /<CatalogFerrisWheel \/>/);
  assert.match(css, /\.catalog-heading\{display:flex;flex-direction:column;align-items:stretch;gap:0\}/);
  assert.match(css, /\.catalog-heading__ornament\{\s*position:relative;inset:auto;right:auto;top:auto;bottom:auto;left:auto;\s*transform:none;width:154px;height:154px/);
  assert.match(css, /\.catalog-heading__ornament\{width:142px;height:142px;flex-basis:142px;margin-top:18px\}/);
});

test('Emojis del catálogo siguen siendo fondo, visibles en márgenes móviles', () => {
  assert.match(css, /\.catalog-page\{width:min\(620px,calc\(100% - 72px\)\)\}/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif\{width:36px;height:36px;opacity:\.82\}/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif-constellation\{\s*position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none/);
});
