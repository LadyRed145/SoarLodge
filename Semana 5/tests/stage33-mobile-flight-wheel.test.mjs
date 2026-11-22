import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { destinationSearchPath } from '../src/lib/destinations.js';

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

test('Buscar aventura permite tap móvil explícito y submit de teclado sin duplicar ruta', () => {
  const home = read('pages/Home.jsx');
  assert.match(home, /const submitMobileTap = \(event\) =>/);
  assert.match(home, /matchMedia\('\(max-width: 760px\)'\)/);
  assert.match(home, /<form className="hero-search" onSubmit=\{submitSearch\}/);
  assert.match(home, /type="submit" onClick=\{submitMobileTap\}/);
  const destinations = [
    { id: 'kioto', name: 'Kioto', country: 'Japón', location: 'Kansai', region: 'asia', activities: [] },
    { id: 'torres-del-paine', name: 'Torres del Paine', country: 'Chile', location: 'Patagonia', region: 'america', activities: [] },
  ];
  assert.equal(destinationSearchPath('japon', destinations), '/destinos/kioto');
  assert.equal(destinationSearchPath('CHILE', destinations), '/destinos/torres-del-paine');
});

test('Móvil conserva las escondidas pero reserva un espacio antes de las tarjetas', () => {
  const css = read('styles/responsive/mobile.css');
  assert.match(css, /\.main-content>\.page-atmosphere--trip \.trip-sky\{/);
  assert.match(css, /top:clamp\(215px,calc\(410px - 25vw\),330px\)/);
  assert.match(css, /\.trip-review-page>\.trip-route-banner\{margin-top:240px\}/);
  assert.match(css, /\.hero-search \.btn-search\{[^}]*touch-action:manipulation/);
  assert.match(css, /\.main-content>\.hero\{z-index:4\}/);
  assert.match(css, /\.main-content>\.section\.explore-strip\{position:relative;z-index:1\}/);
  const choreography = read('lib/trip-sky-choreography.js');
  assert.match(choreography, /route: 'horizontal'/);
  assert.match(choreography, /route: 'vertical'/);
  assert.match(choreography, /route: 'diagonal'/);
});

test('PC y tablet mantienen el círculo completo mientras desaparece la curva suelta', () => {
  const base = read('styles/base.css');
  const desktop = read('styles/responsive/desktop.css');
  const tablet = read('styles/responsive/tablet.css');
  assert.doesNotMatch(base, /\.catalog-heading::?before\s*\{/);
  assert.match(base, /\.catalog-heading__ring\{[^}]*border:2px dashed #ffffffc4/);
  assert.doesNotMatch(desktop, /border-color:transparent;animation:none/);
  assert.doesNotMatch(tablet, /\.catalog-heading__ring[^\n{}]*\{[^}]*display:none/);
  assert.match(read('pages/Catalog.jsx'), /<CatalogFerrisWheel \/>/);
  assert.match(read('components/CatalogFerrisWheel.jsx'), /catalog-ferris-wheel__rotor/);
});
