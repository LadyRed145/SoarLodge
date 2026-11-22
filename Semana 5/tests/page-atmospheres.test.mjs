import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { atmosphereForPath } from '../src/lib/atmosphere.js';

const pageRoutes = [
  ['/destinos', 'catalog'], ['/destinos/tofino', 'detail'],
  ['/favoritos', 'favorites'], ['/mi-viaje', 'trip'],
  ['/checkout', 'checkout'], ['/comprobante/SOAR-12345678', 'voucher'],
  ['/nosotros', 'about'], ['/ruta-desconocida', 'not-found'],
];

test('Cada vista no inicial tiene un ambiente distinto y Inicio conserva su avión', () => {
  assert.equal(atmosphereForPath('/'), null);
  const results = pageRoutes.map(([url, expected]) => {
    assert.equal(atmosphereForPath(url), expected);
    return expected;
  });
  assert.equal(new Set(results).size, results.length);
});

test('Ambientes renderizan únicamente formas decorativas sin formularios ni controles', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: PageAtmosphere } = await vite.ssrLoadModule('/src/components/PageAtmosphere.jsx');
    assert.equal(renderToStaticMarkup(React.createElement(PageAtmosphere, { pathname: '/' })), '');
    for (const [pathname, variant] of pageRoutes) {
      const html = renderToStaticMarkup(React.createElement(PageAtmosphere, { pathname }));
      assert.match(html, new RegExp(`data-atmosphere="${variant}"`));
      assert.match(html, /aria-hidden="true"/);
      if (variant === 'trip') {
        assert.match(html, /data-trip-sky="hide-and-seek"/);
        assert.equal((html.match(/trip-cloud--(?:mint|lilac|butter|peach|blue)/g) ?? []).length, 5);
        assert.match(html, /trip-sky__airplane/);
      } else if (variant === 'detail') {
        assert.match(html, /data-destination-motifs="true"/);
        assert.equal((html.match(/class="destination-motif destination-motif--/g) ?? []).length, 3);
      } else if (variant === 'about') {
        assert.match(html, /data-about-backdrop="passport-postcards"/);
        assert.match(html, /about-passport-stamp--one/);
      } else if (variant === 'checkout') {
        assert.match(html, /data-checkout-decoration="moving-walkways"/);
        assert.equal((html.match(/class="checkout-moving-walkway checkout-moving-walkway--/g) ?? []).length, 3);
        assert.match(html, /page-atmosphere__shape--b/); // círculo punteado aprobado
        assert.doesNotMatch(html, /page-atmosphere__shape--(?:a|c)/); // sin cuadradito
      } else {
        assert.equal((html.match(/page-atmosphere__shape--[abc]/g) ?? []).length, 3);
      }
      assert.doesNotMatch(html, /<button|<input|tabindex|onclick/i);
    }
  } finally { await vite.close(); }
});

test('Los fondos se mantienen detrás del contenido, sin eventos, y respetan movimiento reducido e impresión', () => {
  const css = readStyles();
  const layout = readFileSync(new URL('../src/components/SiteLayout.jsx', import.meta.url), 'utf8');
  const home = readFileSync(new URL('../src/pages/Home.jsx', import.meta.url), 'utf8');
  assert.match(css, /page-atmosphere\{[^}]*pointer-events:none/);
  assert.match(css, /page-atmosphere\{[^}]*z-index:0/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.page-atmosphere__shape/);
  assert.match(css, /@media print\{\.page-atmosphere/);
  assert.match(layout, /<PageAtmosphere pathname=\{location.pathname\}\/>/);
  assert.match(layout, /<BrandMark className="topnote-mark"\/>/);
  assert.doesNotMatch(layout, /topnote[^\n]*✺/);
  assert.match(home, /<HeroFlightTrail\s*\/>/);
  assert.doesNotMatch(home, /PageAtmosphere/);
});

test('Los estilos definen ocho efectos visuales de fondo independientes', () => {
  const css = readStyles();
  for (const [,variant] of pageRoutes) {
    assert.match(css, new RegExp(`\\.page-atmosphere--${variant}\\{`));
  }
  for (const animation of ['soar-compass-turn','soar-aurora-sway','soar-hearts-float','soar-fluffy-drift','soar-walkway-belt','soar-sun-sparkle','soar-paper-plane']) {
    assert.ok(css.includes(`@keyframes ${animation}`), `Missing ${animation}`);
  }
});
