import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLIGHT_ROUTES,
  FLIGHT_CYCLE_MS,
  flightAt,
  positionOnRoute,
} from '../src/lib/flight-routes.js';

const WIDTH = 1200;
const HEIGHT = 680;

test('El avión recorre horizontal, vertical y diagonal en ese orden', () => {
  assert.deepEqual(FLIGHT_ROUTES.map(({ id }) => id), ['horizontal', 'vertical', 'diagonal']);
  let elapsed = 0;
  for (const route of FLIGHT_ROUTES) {
    assert.equal(flightAt(elapsed + 1, WIDTH, HEIGHT)?.route, route.id);
    assert.equal(flightAt(elapsed + route.duration / 2, WIDTH, HEIGHT)?.route, route.id);
    assert.equal(flightAt(elapsed + route.duration, WIDTH, HEIGHT), null);
    assert.equal(flightAt(elapsed + route.duration + route.stopover - 1, WIDTH, HEIGHT), null);
    elapsed += route.duration + route.stopover;
  }
  assert.equal(elapsed, FLIGHT_CYCLE_MS);
  assert.equal(flightAt(FLIGHT_CYCLE_MS, WIDTH, HEIGHT)?.route, 'horizontal');
});

test('La ruta horizontal entra por la izquierda, sale por la derecha y apunta al avance', () => {
  const start = positionOnRoute('horizontal', 0, WIDTH, HEIGHT);
  const middle = positionOnRoute('horizontal', 0.5, WIDTH, HEIGHT);
  const end = positionOnRoute('horizontal', 1, WIDTH, HEIGHT);
  assert.ok(start.x < -44);
  assert.ok(end.x > WIDTH + 44);
  assert.ok(middle.x > start.x && middle.x < end.x);
  assert.ok(Math.abs(middle.angle) < 25);
});

test('La ruta vertical entra por abajo, sale por arriba y orienta la nariz hacia arriba', () => {
  const start = positionOnRoute('vertical', 0, WIDTH, HEIGHT);
  const middle = positionOnRoute('vertical', 0.5, WIDTH, HEIGHT);
  const end = positionOnRoute('vertical', 1, WIDTH, HEIGHT);
  assert.ok(start.y > HEIGHT + 44);
  assert.ok(end.y < -44);
  assert.ok(middle.angle < -70 && middle.angle > -115);
});

test('La ruta diagonal sube desde la izquierda y la dirección sigue la pendiente', () => {
  const start = positionOnRoute('diagonal', 0, WIDTH, HEIGHT);
  const middle = positionOnRoute('diagonal', 0.5, WIDTH, HEIGHT);
  const end = positionOnRoute('diagonal', 1, WIDTH, HEIGHT);
  assert.ok(start.x < -44);
  assert.ok(end.x > WIDTH + 44);
  assert.ok(end.y < start.y);
  assert.ok(middle.angle < -10 && middle.angle > -65);
});

test('Las tres trayectorias funcionan en móvil y escritorio sin valores inválidos', () => {
  for (const [width, height] of [[360, 740], [1440, 760]]) {
    for (const route of FLIGHT_ROUTES) {
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const position = positionOnRoute(route.id, progress, width, height);
        assert.ok(Number.isFinite(position.x));
        assert.ok(Number.isFinite(position.y));
        assert.ok(Number.isFinite(position.angle));
      }
    }
  }
});

test('La animación es decorativa y respeta la preferencia de movimiento reducido', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../src/components/HeroFlightTrail.jsx', import.meta.url), 'utf8');
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /aria-hidden="true"/);
  assert.match(source, /requestAnimationFrame/);
  assert.doesNotMatch(source, /setPlane\(/);
  assert.match(source, /lastRoute === route\.route/);
});


test('La profundidad alterna detrás/delante en cada vuelo sin modificar las tres rutas', () => {
  let cursor = 0;
  const expected = ['behind', 'front', 'behind'];
  for (const [index, route] of FLIGHT_ROUTES.entries()) {
    const atMiddle = flightAt(cursor + route.duration / 2, WIDTH, HEIGHT);
    assert.equal(atMiddle.route, route.id);
    assert.equal(atMiddle.depth, expected[index]);
    assert.equal(flightAt(cursor + route.duration + route.stopover / 2, WIDTH, HEIGHT), null);
    cursor += route.duration + route.stopover;
  }
  assert.equal(flightAt(FLIGHT_CYCLE_MS + 10, WIDTH, HEIGHT).depth, 'front', 'En el segundo ciclo empieza delante');
  assert.equal(flightAt(FLIGHT_CYCLE_MS * 2 + 10, WIDTH, HEIGHT).depth, 'behind', 'En el tercer ciclo vuelve detrás');
});

test('La profundidad del avión y la estela se alterna sin cubrir textos ni controles', async () => {
  const fs = await import('node:fs/promises');
  const component = await fs.readFile(new URL('../src/components/HeroFlightTrail.jsx', import.meta.url), 'utf8');
  const styles = readStyles();
  assert.match(component, /data-depth="behind"/);
  assert.match(component, /wrapper\.dataset\.depth\s*=\s*route\.depth/);
  assert.match(styles, /\.hero-flight-trail\[data-depth="front"\]\{z-index:2\}/);
  assert.match(styles, /\.hero-copy,\.hero-search-shell\{position:relative;z-index:3\}/);
  assert.match(styles, /\.hero-art\{position:relative;z-index:1\}/);
});
