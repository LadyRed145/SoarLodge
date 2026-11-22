import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { destinations, regions } from '../server/data.mjs';
import { destinationSearchPath, filterDestinations } from '../src/lib/destinations.js';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('Inicio abre fichas de destino y países con una sola coincidencia', () => {
  assert.equal(destinationSearchPath(' Chile ', destinations, regions), '/destinos/torres-del-paine');
  assert.equal(destinationSearchPath('JAPÓN', destinations, regions), '/destinos/kioto');
  assert.equal(destinationSearchPath('Kioto', destinations, regions), '/destinos/kioto');
  assert.equal(destinationSearchPath('Tofino', destinations, regions), '/destinos/tofino');
});

test('Las regiones aterrizan filtradas, y búsquedas plurales van a los resultados', () => {
  assert.equal(destinationSearchPath('América', destinations, regions), '/destinos?region=america#resultados');
  assert.equal(destinationSearchPath('Europa', destinations, regions), '/destinos?region=europa#resultados');
  assert.equal(destinationSearchPath('Canada', destinations, regions), '/destinos?q=Canada#resultados');
  assert.equal(destinationSearchPath('Canadá', destinations, regions), '/destinos?q=Canad%C3%A1#resultados');
  assert.equal(destinationSearchPath('playas', destinations, regions), '/destinos?q=playas#resultados');
  assert.equal(destinationSearchPath('  ', destinations, regions), '/destinos#resultados');
  assert.equal(destinationSearchPath('marte', destinations, regions), '/destinos?q=marte#resultados');
  assert.equal(filterDestinations(destinations, { region: 'america' }).length, 3);
});

test('El buscador tiene submit real, filtro de región en catálogo y salto tras cargar', () => {
  const home = read('../src/pages/Home.jsx');
  const catalog = read('../src/pages/Catalog.jsx');
  const hook = read('../src/hooks/useDestinationFilters.js');
  assert.match(home, /type="submit"[^>]*>Buscar aventura/);
  assert.match(home, /onSubmit=\{submitSearch\}/);
  assert.match(catalog, /initialRegion/);
  assert.match(catalog, /destinationsResource\.status !== 'success'/);
  assert.match(catalog, /scrollIntoView/);
  assert.match(hook, /setRegion\(initialRegion\)/);
});

test('Tablet 761–1024 tiene layout independiente, sin elementos apretados', () => {
  const css = readStyles();
  const tablet = css.slice(css.indexOf('/* ETAPA 30 · Composición exclusiva para tablets'));
  assert.match(tablet, /@media \(min-width:761px\) and \(max-width:1024px\)/);
  assert.match(tablet, /\.hero-inner\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(tablet, /\.hero-search\{display:grid/);
  assert.match(tablet, /\.catalog-destination-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(tablet, /\.catalog-heading__ornament\{right:16px;width:148px;height:148px\}/);
  assert.match(tablet, /\.travel-planner-layout \.trip-summary-sticky\{order:1/);
  assert.match(tablet, /\.checkout-layout\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(tablet, /\.about-panels\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media \(min-width:761px\) and \(max-width:1024px\)\{\s*\.mobile-menu-button/);
});
