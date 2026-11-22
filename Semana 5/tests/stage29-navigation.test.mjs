import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';
import { destinations } from '../server/data.mjs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('Buscador grande envía el término y el ancla a resultados, no al encabezado de la noria', () => {
  const home = read('../src/pages/Home.jsx');
  const catalog = read('../src/pages/Catalog.jsx');
  const layout = read('../src/components/SiteLayout.jsx');
  const filter = read('../src/lib/destinations.js');
  assert.match(home, /destinationSearchPath\(search, destinations, regionsResource\.data/);
  assert.match(catalog, /scrollIntoView\(\{ behavior: 'auto', block: 'start' \}\)/);
  assert.match(catalog, /id="resultados"/);
  assert.match(layout, /location\.hash/);
  assert.match(filter, /item\.country/);
});

test('Los cuatro accesos blancos son enlaces reales que van a su contenido', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: Home } = await vite.ssrLoadModule('/src/pages/Home.jsx');
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Home)));
    for (const href of ['/destinos?tipo=vuelos#resultados', '/destinos?tipo=hoteles#resultados', '/favoritos', '/#packs']) {
      assert.ok(html.includes(`href="${href.replace('&','&amp;')}"`), `No existe el enlace a ${href}`);
    }
    assert.match(html, /id="packs"/);
    assert.match(html, /href="\/destinos#resultados"[^>]*>Quiero explorar/);
    const links = html.match(/<nav class="benefit-pills"[^>]*>(.*?)<\/nav>/)?.[1];
    assert.equal((links?.match(/<a /g) ?? []).length, 4);
  } finally { await vite.close(); }
});

test('Al elegir vuelos u hoteles se abre la oferta concreta dentro del destino', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: DestinationCard } = await vite.ssrLoadModule('/src/components/DestinationCard.jsx');
    const { FavoritesProvider } = await vite.ssrLoadModule('/src/context/FavoritesContext.jsx');
    const destination = destinations.find(d => d.id === 'kioto');
    const render = (interest) => renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(FavoritesProvider, null, React.createElement(DestinationCard, { destination, interest }))));
    assert.match(render('vuelos'), /href="\/destinos\/kioto#vuelos"/);
    assert.match(render('vuelos'), /Ver vuelos/);
    assert.match(render('hoteles'), /href="\/destinos\/kioto#hoteles"/);
    assert.match(render('hoteles'), /Ver hoteles/);
    assert.match(render(null), /href="\/destinos\/kioto"/);
    const travel = read('../src/components/TravelOptions.jsx');
    assert.match(travel, /resource\.status !== 'success'/);
    assert.match(travel, /getElementById\(anchor\)\?\.scrollIntoView/);
  } finally { await vite.close(); }
});

test('En móvil se eligen opciones primero y el resumen/checkout aparece después', () => {
  const jsx = read('../src/components/TravelOptions.jsx');
  const css = readStyles();
  assert.ok(jsx.indexOf('className="travel-offers-main"') < jsx.indexOf('className="trip-summary-sticky"'));
  assert.ok(css.lastIndexOf('.travel-planner-layout .trip-summary-sticky{order:1') > css.indexOf('.trip-summary-sticky{position:static;order:-1'));
  assert.match(css, /\.travel-planner-layout \.travel-offers-main\{order:0\}/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(jsx, /Continuar al pago de prueba/);
});

test('Decoraciones no invaden botón de favoritos en el detalle móvil', () => {
  const css = readStyles();
  assert.match(css, /\.page-atmosphere--detail \.destination-motif--1\{top:660px;left:0;right:auto\}/);
  assert.match(css, /\.destination-motifs,[^\n]*pointer-events:none/);
});
