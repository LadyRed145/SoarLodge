import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { destinationVisual } from '../src/lib/visuals.js';

const base = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Ordenamiento usa un menú estilizado, sin select ni controles permanentes duplicados', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: SortControl } = await vite.ssrLoadModule('/src/components/SortControl.jsx');
    const html = renderToStaticMarkup(React.createElement(SortControl, { value: 'name', onChange() {} }));
    assert.match(html, /sort-menu-trigger/);
    assert.match(html, /Ordenar destinos: Destino A–Z/);
    assert.match(html, /aria-expanded="false"/);
    assert.doesNotMatch(html, /<select/);
    assert.doesNotMatch(html, /sort-menu-option/);
  } finally { await vite.close(); }
});

test('El menú tiene diseño flotante y respuesta para móvil', () => {
  const css = readFileSync(resolve(base, 'src/components/SortControl.css'), 'utf8');
  assert.match(css, /\.sort-menu-options\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.sort-menu-trigger\s*\{[^}]*border-radius:/s);
  assert.match(css, /max-width:\s*760px/);
  assert.match(css, /prefers-reduced-motion/);
});

test('Lisboa y Marrakech usan fotos panorámicas nuevas con crédito y SVG de respaldo', () => {
  const photos = [
    ['lisboa', 'photo-1748279944004-f1d733dc711b', 'Aleksandr Zaitsev'],
    ['marrakech', 'photo-1770970389629-86cac3ef3e12', 'Val Vesa'],
  ];
  for (const [destination, photoId, author] of photos) {
    const visual = destinationVisual(destination);
    assert.ok(visual.src.includes(photoId));
    assert.equal(visual.credit, author);
    assert.ok(existsSync(resolve(base, 'public', visual.fallback.slice(1))));
  }
});


test('El encabezado de Destinos integra una noria de ocho góndolas dentro del aro giratorio', () => {
  const page = read('../src/pages/Catalog.jsx');
  const css = readStyles();
  assert.match(page, /catalog-heading__ornament/);
  assert.match(page, /<CatalogFerrisWheel\s*\/>/);
  assert.match(css, /\.catalog-heading__ring\{/);
  assert.match(css, /@keyframes soar-ferris-wheel-turn/);
  assert.match(css, /\.catalog-heading::after\{display:none!important/);
  const wheel = read('../src/components/CatalogFerrisWheel.jsx');
  assert.match(wheel, /catalog-ferris-wheel__rotor/);
  assert.equal((wheel.match(/color: '#/g) ?? []).length, 8);
});


test('Solo Región A–Z usa cabeceras por grupo con nombres y recuentos', () => {
  const catalog = read('../src/pages/Catalog.jsx');
  const styles = readStyles();
  assert.match(catalog, /filters\.order === 'region'/);
  assert.match(catalog, /groupDestinationsByRegion\(filters\.filtered\)/);
  assert.match(catalog, /regions\.find\(\(region\) => region\.id === group\.id\)\?\.name/);
  assert.match(catalog, /catalog-region-heading__count/);
  assert.match(catalog, /catalog-region-section/);
  assert.match(catalog, /: <div className="destination-grid catalog-destination-grid">/);
  assert.match(styles, /\.catalog-region-heading\{/);
  assert.match(styles, /@media\(max-width:530px\)\{\.catalog-region-groups/);
});
