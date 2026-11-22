import { readStyles } from './read-styles.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('Checkout reutiliza el fondo y añade tres pasillos móviles, sin el cuadrado', () => {
  const atmosphere = read('../src/components/PageAtmosphere.jsx');
  const component = read('../src/components/CheckoutWalkways.jsx');
  const styles = readStyles();
  assert.match(atmosphere, /variant === 'checkout' \? <>/);
  assert.match(atmosphere, /<CheckoutWalkways \/>/);
  assert.equal((component.match(/className="checkout-moving-walkway checkout-moving-walkway--/g) ?? []).length, 3);
  assert.match(styles, /\.page-atmosphere--checkout \.page-atmosphere__shape--b\{/);
  assert.doesNotMatch(styles, /\.page-atmosphere--checkout \.page-atmosphere__shape--c\{/);
  assert.doesNotMatch(styles, /\.page-atmosphere--checkout \.page-atmosphere__shape--a\{/);
});

test('Las cintas avanzan en un solo sentido y no interrumpen la experiencia', () => {
  const css = readStyles();
  const component = read('../src/components/CheckoutWalkways.jsx');
  assert.match(css, /@keyframes soar-walkway-belt\{from\{background-position:0 0\}to\{background-position:0 34px\}\}/);
  assert.match(css, /\.checkout-moving-walkway::before\{[^}]*animation:soar-walkway-belt 4\.6s linear infinite/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.checkout-moving-walkway::before\{animation:none!important\}\}/);
  assert.match(css, /\.checkout-moving-walkways\{[^}]*pointer-events:none/);
  assert.match(component, /aria-hidden="true"/);
  assert.doesNotMatch(component, /<button|<input|onClick/);
});
