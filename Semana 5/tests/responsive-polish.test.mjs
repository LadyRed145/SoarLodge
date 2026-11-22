import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readStyles();
const home = readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../src/pages/Catalog.jsx', import.meta.url), 'utf8');
const motif = readFileSync(new URL('../src/components/CatalogMotifs.jsx', import.meta.url), 'utf8');

test('Inicio conserva el collage y limita la tipografía para tablet y móvil', () => {
  assert.match(home, /className="hero-copy"/);
  assert.match(home, /className="hero-art"/);
  assert.match(css, /@media \(min-width:1025px\) and \(max-width:1100px\)\{\s*\.hero-inner\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /\.hero h1\{font-size:clamp\(39px,4\.9vw,57px\);line-height:1\.13/);
  assert.match(css, /@media\(max-width:760px\)\{\s*\.hero-inner\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css, /\.hero h1\{font-size:clamp\(36px,7\.5vw,58px\);line-height:1\.14/);
  assert.match(css, /@media\(max-width:400px\)/);
  assert.match(css, /\.hero-search\{display:grid;grid-template-columns:54px/);
});

test('Destinos mantiene nueve insignias en el fondo y visibilidad reforzada en pantallas pequeñas', () => {
  assert.match(catalog, /className="layout-width catalog-page"/);
  assert.match(motif, /catalog-motif-constellation/);
  assert.match(motif, /Object\.entries\(DESTINATION_MOTIFS\)/);
  assert.match(css, /@media \(min-width:761px\) and \(max-width:1100px\)\{\s*\.catalog-page\{width:min\(1200px,calc\(100% - 92px\)\)\}/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif\{width:52px;height:52px;opacity:\.77\}/);
  assert.match(css, /@media\(max-width:760px\)\{\s*\.catalog-page\{width:min\(620px,calc\(100% - 64px\)\)\}/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif\{width:44px;height:44px;opacity:\.8\}/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif__icon\{font-size:26px;opacity:1/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif-constellation\{\s*position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none/);
});

test('Detalle de destino retiene sus motivos y navegación intermedia deja de comprimir enlaces', () => {
  assert.match(css, /\.destination-motif\{opacity:\.56;width:54px;height:54px/);
  assert.match(css, /@media \(min-width:761px\) and \(max-width:1024px\)\{/);
  assert.match(css, /\.primary-nav\.is-open\{display:flex\}/);
  assert.match(css, /@media\(max-width:620px\)\{\s*\.catalog-destination-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.page-atmosphere--catalog \.catalog-motif\{animation:none!important/);
});
