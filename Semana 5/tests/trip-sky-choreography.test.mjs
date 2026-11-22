import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TRIP_SKY_SEGMENTS, TRIP_SKY_CYCLE_MS, tripSkyAt, peekDistance, peekPosition } from '../src/lib/trip-sky-choreography.js';
import { positionOnRoute } from '../src/lib/flight-routes.js';

const anchors = (cloud, width, height) => ({
  hidden: peekPosition(cloud, 0, width, height),
  out: peekPosition(cloud, .5, width, height),
  back: peekPosition(cloud, 1, width, height),
});

function startOf(index) {
  return TRIP_SKY_SEGMENTS.slice(0, index).reduce((sum, step) => sum + step.duration, 0);
}

test('El avión sale del escondite, se asoma, espera y vuelve POR EL MISMO CAMINO', () => {
  for (const [width, height] of [[1440, 600], [390, 460]]) {
    for (const cloud of ['mint', 'peach']) {
      const {hidden, out, back} = anchors(cloud, width, height);
      assert.equal(hidden.x, back.x);
      assert.equal(hidden.y, back.y);
      assert.equal(peekDistance(0), 0);
      assert.equal(peekDistance(.50), 1);
      assert.equal(peekDistance(1), 0);
      assert.ok(Math.abs(out.x - hidden.x) > 60);
      assert.equal(Math.sign(out.x - hidden.x), cloud === 'mint' ? 1 : -1);
      assert.ok([hidden, out, back].every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.angle)));
    }
  }
});

test('Primero juega a esconderse; los vuelos ocasionales usan las tres direcciones originales', () => {
  assert.deepEqual(TRIP_SKY_SEGMENTS.filter(x => x.kind === 'flight').map(x => x.route), ['horizontal','vertical','diagonal']);
  assert.deepEqual(TRIP_SKY_SEGMENTS.filter(x => x.kind === 'peek').map(x => x.cloud), ['mint','peach','mint','peach']);
  assert.ok(TRIP_SKY_SEGMENTS.some(x => x.kind === 'pause'));
  assert.equal(TRIP_SKY_CYCLE_MS, TRIP_SKY_SEGMENTS.reduce((sum, x) => sum + x.duration, 0));
  for (const [i, entry] of TRIP_SKY_SEGMENTS.entries()) {
    const time = startOf(i) + entry.duration * .5;
    const state = tripSkyAt(time, 1280, 560);
    if (entry.kind === 'pause') assert.equal(state, null);
    else {
      assert.equal(state.kind, entry.kind);
      if (entry.kind === 'flight') {
        assert.equal(state.route, entry.route);
        const original = positionOnRoute(entry.route, .5, 1280, 560);
        assert.deepEqual({x:state.x,y:state.y,angle:state.angle}, original);
      } else assert.equal(state.cloud, entry.cloud);
    }
  }
});

test('Las rutas no desaparecen ni se salen con tamaños de móvil o escritorio', () => {
  for (const [width, height] of [[360,460],[760,500],[1920,610]]) {
    for (let time=0; time < TRIP_SKY_CYCLE_MS; time+=250) {
      const state = tripSkyAt(time, width, height);
      if (state) assert.ok([state.x,state.y,state.angle].every(Number.isFinite));
    }
    assert.equal(tripSkyAt(TRIP_SKY_CYCLE_MS + 500, width, height)?.kind, tripSkyAt(500, width, height)?.kind);
  }
});

test('Dos nubes reales de primer plano tapan al avión, el DOM no tiene botones ni contenido leído', () => {
  const scene = readFileSync(new URL('../src/components/TripSkyScene.jsx', import.meta.url),'utf8');
  const css = readStyles();
  assert.match(scene, /trip-sky__front/);
  assert.match(scene, /color="mint" foreground/);
  assert.match(scene, /color="peach" foreground/);
  assert.match(scene, /aria-hidden="true"/);
  assert.match(css, /\.trip-sky__plane\{z-index:2/);
  assert.match(css, /\.trip-sky__front\{z-index:3/);
  assert.match(css, /\.trip-cloud--mint\{[^}]*left:-1.6%/);
  assert.match(css, /\.trip-cloud--peach\{[^}]*right:7%/);
  assert.match(css, /\.trip-sky__plane\[data-mode=[\"']peek[\"']\]/);
  assert.doesNotMatch(scene, /<button|<input|onClick/);
});
