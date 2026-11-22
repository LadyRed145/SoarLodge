import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Inicio ya no usa un separador suelto: su transición es un horizonte integrado', () => {
  const home = read('../src/pages/Home.jsx');
  const css = readStyles();
  assert.doesNotMatch(home, /home-soft-divider/);
  assert.doesNotMatch(css, /home-soft-divider/);
  assert.match(css, /\.featured-section::before\{[^}]*border-radius:54% 46%/);
  assert.match(css, /\.featured-section>\.layout-width\{[^}]*z-index:1/);
  assert.match(home, /<HeroFlightTrail\s*\/>/);
});

test('Mi viaje tiene nubes PASTEL distintas y dos capas de profundidad', () => {
  const sky = read('../src/components/TripSkyScene.jsx');
  const css = readStyles();
  for (const color of ['mint','lilac','butter','peach','blue']) {
    assert.match(sky, new RegExp(`['\"]${color}['\"]`));
    assert.match(css, new RegExp(`\.trip-cloud--${color}\{color:#(?:[0-9a-f]{6})`));
  }
  assert.match(sky, /trip-sky__back/);
  assert.match(sky, /trip-sky__plane/);
  assert.match(sky, /trip-sky__front/);
  assert.match(css, /\.trip-sky__back\{z-index:1/);
  assert.match(css, /\.trip-sky__plane\{z-index:2/);
  assert.match(css, /\.trip-sky__front\{z-index:3/);
  assert.doesNotMatch(css, /\.page-atmosphere--trip \.page-atmosphere__shape--a\{/);
});

test('Avión del escondite comparte silueta con el avión aprobado del Inicio', () => {
  const sky = read('../src/components/TripSkyScene.jsx');
  const original = read('../src/components/HeroFlightTrail.jsx');
  const silhouette = 'M60 32c0-3-3.5-5.1-9-5.6';
  assert.ok(original.includes(silhouette));
  assert.ok(sky.includes(silhouette));
});

test('Las nubes flotan por CSS y el avión sigue un recorrido real sin actualizar React por frame', () => {
  const css = readStyles();
  const sky = read('../src/components/TripSkyScene.jsx');
  assert.match(css, /@keyframes soar-fluffy-drift/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\s*\.trip-cloud\{animation:none!important/);
  assert.match(sky, /tripSkyAt\(/);
  assert.match(sky, /window.requestAnimationFrame\(tick\)/);
  assert.match(sky, /plane.style.transform/);
  assert.doesNotMatch(sky, /useState|setInterval/);
});


test('Mi viaje elimina las protuberancias y protege la lectura del título', () => {
  const sky = read('../src/components/TripSkyScene.jsx');
  const page = read('../src/pages/TripReview.jsx');
  const css = readStyles();
  assert.doesNotMatch(sky, /trip-cloud__hideout/);
  assert.doesNotMatch(css, /trip-cloud__hideout/);
  assert.match(page, /<header className="trip-review-intro">/);
  assert.match(css, /\.trip-review-intro::before\{/);
  assert.match(css, /\.trip-cloud--lilac\{[^}]*left:70%/);
});
