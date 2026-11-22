import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
const base = source('styles/base.css');
const desktop = source('styles/responsive/desktop.css');
const tablet = source('styles/responsive/tablet.css');
const mobile = source('styles/responsive/mobile.css');
const review = source('pages/TripReview.jsx');

test('Mi viaje: ruta, voucher y resumen usan la tarjeta blanca de 740px como referencia', () => {
  assert.match(base, /\.trip-route-banner\{[^}]*max-width:740px/);
  assert.match(base, /\.previous-voucher\{[^}]*max-width:740px;width:100%/);
  assert.match(base, /\.trip-review-page \.trip-summary\{[^}]*max-width:740px/);
  assert.match(desktop, /\.trip-review-page > \.review-empty \{[\s\S]*?max-width: 740px;/);
});

test('PC/tablet: acciones inferiores siguen el inicio del botón interior (1px borde + 25px padding)', () => {
  assert.match(base, /\.trip-summary\{[^}]*border:1px[^}]*padding:25px/);
  assert.match(desktop, /@media\(min-width:1025px\)\{\s*\.trip-review-page \.review-actions\{max-width:740px;width:100%;padding-inline:26px\}/);
  assert.match(tablet, /\.trip-review-page \.review-actions\{padding-inline:26px\}/);
  assert.match(tablet, /\.trip-review-page \.review-actions,\s*\.trip-review-page > \.review-empty\{max-width:min\(740px,calc\(100% - clamp\(72px,9vw,120px\)\)\);margin-inline:0\}/);
  assert.match(mobile, /\.review-actions\{display:grid;grid-template-columns:1fr\}/);
});

test('Los enlaces conservan destino, texto y funciones existentes', () => {
  assert.match(review, /Ver último voucher ↗/);
  assert.match(review, /Editar vuelos y alojamientos ↗/);
  assert.match(review, /Explorar otros destinos/);
  assert.match(review, /<TripSummary favorite=/);
});

test('Sin plan guardado, escritorio ancho conserva el ancho y alineación de las otras tarjetas', () => {
  assert.match(desktop, /@media \(min-width: 1025px\) \{\s*\.trip-review-page > \.review-empty \{[\s\S]*?width: 100%;[\s\S]*?max-width: 740px;/);
  assert.match(review, /\{stored\.destinationId \? <SavedTrip/);
  assert.match(review, /className="review-empty"/);
});


test('Mi viaje vacío: PC y tablet igualan el ancho de las otras tarjetas, móvil intacto', () => {
  assert.match(desktop, /SOARLODGE_EMPTY_CARD_ALIGNED_V2/);
  assert.match(desktop, /\.trip-review-page > \.review-empty \{[\s\S]*?max-width: 740px;/);
  assert.match(tablet, /\.trip-review-page > \.review-empty\{max-width:min\(740px,calc\(100% - clamp\(72px,9vw,120px\)\)\);margin-inline:0\}/);
  assert.doesNotMatch(base, /SOARLODGE_EMPTY_CARD_ALIGNED_V2/);
});
