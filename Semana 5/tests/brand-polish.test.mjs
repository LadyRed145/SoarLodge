import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

const source = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

async function withVite(fn) {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try { await fn(vite); }
  finally { await vite.close(); }
}

test('El nuevo logo usa IDs SVG únicos incluso con tres instancias en la misma vista', async () => withVite(async (vite) => {
  const { default: BrandMark } = await vite.ssrLoadModule('/src/components/BrandMark.jsx');
  const html = renderToStaticMarkup(React.createElement('div', null,
    React.createElement(BrandMark), React.createElement(BrandMark), React.createElement(BrandMark)));
  const ids = [...html.matchAll(/<linearGradient\s+id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 6);
  assert.equal(new Set(ids).size, 6, 'No duplicate gradient ids are allowed');
  for (const id of ids) assert.ok(html.includes(`url(#${id})`), `Missing gradient reference: ${id}`);
}));

test('Catálogo elimina el sello superpuesto; Nosotros y 404 mantienen marca sin introducir formularios', async () => withVite(async (vite) => {
  const components = [
    ['/src/pages/About.jsx', 'about-brand-stamp'],
    ['/src/pages/NotFound.jsx', 'not-found--postcard'],
  ];
  const { default: Catalog } = await vite.ssrLoadModule('/src/pages/Catalog.jsx');
  const catalog = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Catalog)));
  assert.match(catalog, /catalog-heading/);
  assert.doesNotMatch(catalog, /catalog-brand-stamp|catalog-heading-mark/);
  for (const [path, className] of components) {
    const { default: Page } = await vite.ssrLoadModule(path);
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Page)));
    assert.ok(html.includes(className), `${path} is missing ${className}`);
    assert.match(html, /soarlodge-bg-/, `${path} is missing the new brand SVG`);
  }
}));

test('Header, pie, Favoritos, detalle, Mi viaje, checkout y voucher comparten BrandMark', () => {
  for (const file of ['components/SiteLayout.jsx', 'pages/Favorites.jsx', 'pages/DestinationDetail.jsx',
    'pages/TripReview.jsx', 'pages/Checkout.jsx', 'pages/Voucher.jsx']) {
    const content = source(file);
    assert.ok(content.includes("import BrandMark from '../components/BrandMark.jsx'") ||
      content.includes("import BrandMark from './BrandMark.jsx'"), `Missing BrandMark import in ${file}`);
    assert.match(content, /<BrandMark\s+className=/, `No BrandMark instance in ${file}`);
  }
});

test('El checkout utiliza postales con respaldo SVG y no elimina la confirmación de prueba', () => {
  const checkout = source('pages/Checkout.jsx');
  assert.match(checkout, /<Photo\s+\{\.\.\.destinationVisual\(destinationId\)\}/);
  assert.match(checkout, /submitDemoBooking\(/);
  assert.match(checkout, /requestLock\.current/);
  assert.match(checkout, /checkout-customer-name/);
});

test('Las animaciones de postales respetan movimiento reducido e impresión', () => {
  const css = readStyles();
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.destination-card,\.offer-card\{animation:none!important/);
  assert.match(css, /@media print\{\s*\.destination-card,\.offer-card\{animation:none!important/);
  // Etapa 20: el aro es un elemento real, no el ::after eliminado.
  assert.match(css, /\.catalog-heading__ring\{/);
  assert.match(css, /\.catalog-ferris-wheel\{/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.catalog-ferris-wheel__rotor[^}]*animation:none!important/);
  assert.match(css, /@media print\{\.page-atmosphere,\.catalog-heading__ornament\{display:none!important\}/);
  assert.match(css, /\.trip-route-banner/);
});
