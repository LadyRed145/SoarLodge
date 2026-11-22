import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readStyles();
const base = readFileSync(new URL('../src/styles/base.css', import.meta.url), 'utf8');
const tablet = readFileSync(new URL('../src/styles/responsive/tablet.css', import.meta.url), 'utf8');
const scene = readFileSync(new URL('../src/components/TripSkyScene.jsx', import.meta.url), 'utf8');

// Un banner ancho como toda la página taparía las nubes de la derecha.
test('Mi viaje: confirmación y ruta igualan el ancho del resumen blanco en escritorio', () => {
  assert.match(base, /\.trip-route-banner\{[^}]*max-width:740px/);
  assert.match(base, /\.previous-voucher\{[^}]*max-width:740px;width:100%/);
  assert.match(base, /\.previous-voucher\{[^}]*justify-content:space-between/);
});

test('Tablet conserva una zona libre para nubes y avión y alinea tarjetas', () => {
  assert.match(tablet, /@media\(min-width:761px\) and \(max-width:1024px\)/);
  assert.match(tablet, /\.trip-route-banner,\s*\.previous-voucher,\s*\.trip-review-page \.trip-summary/);
  assert.match(tablet, /max-width:min\(740px,calc\(100% - clamp\(72px,9vw,120px\)\)\);margin-inline:0/);
  assert.match(tablet, /\.trip-review-page \.trip-summary\{margin:0\}/);
  assert.match(tablet, /\.page-atmosphere--trip \.trip-cloud--butter\{right:1%;width:clamp\(90px,10vw,112px\)\}/);
});

test('El avión y las cinco nubes siguen intactos en las mismas capas', () => {
  assert.match(scene, /tripSkyAt\(now - startAt, width, height\)/);
  assert.match(scene, /<PastelCloud color="lilac" \/><PastelCloud color="butter" \/><PastelCloud color="blue" \/>/);
  assert.match(scene, /<PastelCloud color="mint" foreground \/>/);
  assert.match(scene, /<PastelCloud color="peach" foreground \/>/);
  assert.match(css, /\.trip-sky__plane\{z-index:2/);
  assert.match(css, /\.trip-sky__front\{z-index:3/);
});
