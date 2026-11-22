import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { destinations } from '../server/data.mjs';
import { DESTINATION_MOTIFS, motifsForPath } from '../src/lib/destination-motifs.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Los nueve destinos REST tienen sus propias insignias y no repiten exactamente el mismo conjunto', () => {
  assert.equal(destinations.length, 9);
  assert.deepEqual(Object.keys(DESTINATION_MOTIFS).sort(), destinations.map((d) => d.id).sort());
  for (const destination of destinations) {
    const motifs = motifsForPath(`/destinos/${destination.id}`);
    assert.ok(motifs, destination.id);
    assert.equal(motifs.length, 3);
    assert.equal(new Set(motifs).size, motifs.length);
    assert.ok(motifs.every((symbol) => typeof symbol === 'string' && symbol.length >= 1));
  }
  assert.equal(new Set(Object.values(DESTINATION_MOTIFS).map((motifs) => motifs.join(','))).size, 9);
});

test('Solo los detalles conocidos renderizan motivos; las otras vistas, incluido Inicio, no', () => {
  for (const url of ['/', '/destinos', '/nosotros', '/checkout', '/mi-viaje', '/destinos/no-existe', '/destinos/%ZZ']) {
    assert.equal(motifsForPath(url), null, url);
  }
  assert.deepEqual(motifsForPath('/destinos/torres-del-paine'), DESTINATION_MOTIFS['torres-del-paine']);
});

test('Cada ficha tiene motivos decorativos inaccesibles al foco, Nosotros postales y sellos', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: PageAtmosphere } = await vite.ssrLoadModule('/src/components/PageAtmosphere.jsx');
    for (const { id } of destinations) {
      const html = renderToStaticMarkup(React.createElement(PageAtmosphere, { pathname: `/destinos/${id}` }));
      assert.match(html, /aria-hidden="true"/);
      assert.match(html, /data-destination-motifs="true"/);
      assert.equal((html.match(/class="destination-motif destination-motif--/g) || []).length, 3);
      for (const symbol of DESTINATION_MOTIFS[id]) assert.ok(html.includes(symbol), `${id}: ${symbol}`);
      assert.doesNotMatch(html, /<input|<button|tabindex|onclick/i);
    }
    const about = renderToStaticMarkup(React.createElement(PageAtmosphere, { pathname: '/nosotros' }));
    assert.match(about, /data-about-backdrop="passport-postcards"/);
    assert.equal((about.match(/class="about-passport-stamp about-passport-stamp--/g) || []).length, 2);
    assert.match(about, /about-postcard/);
    assert.match(about, /about-compass/);
    assert.doesNotMatch(about, /<input|<button|tabindex|onclick/i);
  } finally { await vite.close(); }
});

test('Fondos en capas, sin eventos, con motion reducido, impresión limpia e Inicio intacto', () => {
  const css = readStyles();
  const home = read('../src/pages/Home.jsx');
  const sky = read('../src/components/TripSkyScene.jsx');
  assert.match(css, /\.destination-motifs,\.about-travel-backdrop\{[^}]*pointer-events:none/);
  assert.match(css, /\.main-content>:not\(\.page-atmosphere\)\{[^}]*z-index:1/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.destination-motif/);
  assert.match(css, /@media print\{\.destination-motifs,\.about-travel-backdrop\{display:none!important/);
  assert.match(home, /<HeroFlightTrail\s*\/>/);
  assert.match(sky, /tripSkyAt\(/);
});


test('Catálogo reparte nueve insignias por el fondo general, no en el encabezado verde', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: PageAtmosphere } = await vite.ssrLoadModule('/src/components/PageAtmosphere.jsx');
    const html = renderToStaticMarkup(React.createElement(PageAtmosphere, { pathname: '/destinos' }));
    assert.match(html, /data-atmosphere="catalog"/);
    assert.match(html, /data-catalog-motifs="nine-destinations"/);
    assert.equal((html.match(/class="catalog-motif catalog-motif--/g) ?? []).length, 9);
    for (const destination of destinations) assert.match(html, new RegExp(`data-destination="${destination.id}"`));
    assert.match(html, /aria-hidden="true"/);
    assert.doesNotMatch(html, /<input|<button|tabindex|onclick/i);
    const catalog = read('../src/pages/Catalog.jsx');
    assert.doesNotMatch(catalog, /CatalogMotifs|catalog-motif-constellation/);
    assert.match(catalog, /<SortControl/);
    assert.match(catalog, /useDestinationFilters/);
    const atmosphere = read('../src/components/PageAtmosphere.jsx');
    assert.match(atmosphere, /variant === 'catalog' && <CatalogMotifs \/>/);
  } finally { await vite.close(); }
});

test('Insignias distribuidas a lo largo de toda la vista, sin eventos, compatibles con móvil y movimiento reducido', () => {
  const css = readStyles();
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif-constellation\{[^}]*position:absolute;inset:0/);
  assert.match(css, /\.page-atmosphere--catalog \.catalog-motif-constellation\{[^}]*pointer-events:none/);
  for (const [index, start] of [8,19,31,42,53,64,74,85,89].entries()) {
    assert.match(css, new RegExp(`\\.page-atmosphere--catalog \\.catalog-motif--${index+1}\\{top:${start}%`));
  }
  assert.match(css, /@keyframes soar-catalog-motif-drift/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*?\.page-atmosphere--catalog \.catalog-motif/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.page-atmosphere--catalog \.catalog-motif\{animation:none!important/);
  assert.match(css, /@media print\{\.page-atmosphere--catalog \.catalog-motif-constellation\{display:none!important/);
  assert.doesNotMatch(css, /\.catalog-motif-constellation\{position:absolute;right:/);
});


test('El arbolito del catálogo no queda detrás de las tarjetas de la última fila', () => {
  const css = readStyles();
  assert.match(css, /\.catalog-motif--9\{top:89%;left:2%/);
  assert.match(css, /@media\(max-width:760px\)\{[\s\S]*\.catalog-motif--9\{left:1%/);
});
