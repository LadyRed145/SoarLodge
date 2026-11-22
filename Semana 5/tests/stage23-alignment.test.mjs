import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('La noria se coloca con posición absoluta real, centrada en altura dentro del banner', () => {
  const css = readStyles();
  const catalog = read('../src/pages/Catalog.jsx');
  assert.match(css, /\.catalog-heading>div:first-child\{position:relative;z-index:1\}/);
  assert.doesNotMatch(css, /\.catalog-heading>div\{position:relative;z-index:1\}/);
  assert.match(css, /\.catalog-heading__ornament\{position:absolute;right:clamp\(48px,8%,110px\);top:50%;[^}]*transform:translateY\(-50%\)/);
  assert.match(catalog, /<CatalogFerrisWheel \/>/);
  assert.match(css, /\.catalog-ferris-wheel__rotor\{[^}]*animation:soar-ferris-wheel-turn/);
});

test('Los dos corazones extra son parte del fondo, sin burbujas ni contenido interactivo', () => {
  const component = read('../src/components/PageAtmosphere.jsx');
  const favorites = read('../src/pages/Favorites.jsx');
  const css = readStyles();
  assert.match(component, /variant === 'favorites' && <>[\s\S]*shape--d[\s\S]*shape--e/);
  assert.match(css, /\.page-atmosphere--favorites \.page-atmosphere__shape::before\{content:[\"']♡[\"']\}/);
  assert.match(css, /\.page-atmosphere--favorites \.page-atmosphere__shape--d\{/);
  assert.match(css, /\.page-atmosphere--favorites \.page-atmosphere__shape--e\{/);
  assert.doesNotMatch(favorites, /favorites-heart-pair|favorites-heart--one|favorites-heart--two/);
  assert.doesNotMatch(css, /favorites-heart-pair|favorites-heart--one|favorites-heart--two/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.page-atmosphere__shape/);
});
