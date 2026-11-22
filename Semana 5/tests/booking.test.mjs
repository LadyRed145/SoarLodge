import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { BookingError, createDemoBooking } from '../server/bookings.mjs';
import { flights, hotels } from '../server/travel-data.mjs';
import { calculateTripPrice } from '../src/lib/pricing.js';
import { normalizeFavorites, toggleFavorite } from '../src/lib/favorites.js';
import { validateVoucher, voucherText, readVoucher, submitDemoBooking } from '../src/lib/booking.js';

const flight = flights.find((v) => v.destinationId === 'kioto' && v.available);
const hotel = hotels.find((v) => v.destinationId === 'kioto' && v.available && v.checkIn === flight.departureDate);
const valid = () => ({ destinationId: 'kioto', flightId: flight.id, hotelId: hotel.id,
  travelers: 2, rooms: 1, favorite: true, paymentMethod: 'demo-card',
  customer: { name: 'Prueba Viaje', email: 'prueba@example.com' }, total: 1 });
async function withServer(callback) {
  const server = createServer(createHandler({ delayMs: 0 }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try { return await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((res) => server.close(res)); }
}

test('Favoritos elimina duplicados, rechaza IDs corruptos y alterna guardado', () => {
  assert.deepEqual(normalizeFavorites(['kioto', 'kioto', '../hack', 12, 'bali']), ['kioto', 'bali']);
  assert.deepEqual(toggleFavorite(['kioto'], 'kioto'), []);
  assert.deepEqual(toggleFavorite([], 'bali'), ['bali']);
  assert.deepEqual(toggleFavorite([], '../foo'), []);
});
test('Pack calcula viajes para pasajeros y habitaciones con 8% + 3% sobre subtotal', () => {
  const p = calculateTripPrice({ flight, hotel, travelers: 2, rooms: 1, favorite: true });
  assert.equal(p.flightTotal, flight.price * 2);
  assert.equal(p.hotelTotal, hotel.nightlyPrice * 7);
  assert.equal(p.packageDiscount, Math.round(p.subtotal * .08));
  assert.equal(p.favoriteDiscount, Math.round(p.subtotal * .03));
  assert.equal(p.total, p.subtotal - p.packageDiscount - p.favoriteDiscount);
});
test('Sin favorito aplica solo el 8%, sin cambiar el subtotal', () => {
  const withFav = calculateTripPrice({ flight, hotel, favorite: true });
  const noFav = calculateTripPrice({ flight, hotel, favorite: false });
  assert.equal(noFav.favoriteDiscount, 0);
  assert.equal(noFav.subtotal, withFav.subtotal);
  assert.equal(noFav.total, withFav.total + withFav.favoriteDiscount);
});
test('No calcula precios de fechas incompatibles ni grupos inválidos', () => {
  assert.equal(calculateTripPrice({ flight, hotel: hotels.find((v) => v.destinationId === 'kioto' && v.checkIn !== flight.departureDate) }), null);
  assert.equal(calculateTripPrice({ flight, hotel, travelers: 0 }), null);
  assert.equal(calculateTripPrice({ flight, hotel, rooms: 10 }), null);
});
test('Servidor reconstruye precio y no acepta el total manipulado por cliente', () => {
  const data = createDemoBooking(valid());
  assert.match(data.bookingId, /^SOAR-[A-F\d]{8}$/);
  assert.ok(data.total > 1);
  assert.equal(data.mode, 'DEMO');
  assert.ok(validateVoucher(data));
  assert.equal(JSON.stringify(data).includes('prueba@example.com'), false);
  assert.equal(JSON.stringify(data).includes('Prueba Viaje'), false);
  assert.equal(data.favoriteDiscount > 0, true);
});
test('Servidor valida destino, fechas, disponibilidad y método ficticio', () => {
  const invalid = [
    { ...valid(), destinationId: 'bali' },
    { ...valid(), hotelId: hotels.find(v => v.destinationId === 'kioto' && v.checkIn !== flight.departureDate).id },
    { ...valid(), travelers: 100 },
    { ...valid(), flightId: flights.find(v => v.destinationId === 'kioto' && !v.available).id },
    { ...valid(), paymentMethod: 'real-card' },
    { ...valid(), customer: { name: '', email: 'bad' } },
  ];
  for (const payload of invalid) assert.throws(() => createDemoBooking(payload), BookingError);
});
test('Voucher se valida y tiene totales coherentes, sin datos privados', () => {
  const voucher = createDemoBooking(valid());
  assert.ok(readVoucher(JSON.stringify(voucher)));
  assert.equal(readVoucher('not json'), null);
  assert.equal(validateVoucher({ ...voucher, total: 2 }), false);
  const txt = voucherText(voucher);
  assert.match(txt, /TOTAL DEMO/);
  assert.match(txt, /SIN VALIDEZ COMERCIAL/);
  assert.doesNotMatch(txt, /prueba@example\.com/);
});
test('POST /api/bookings responde 201 con comprobante y GET responde 405', () => withServer(async base => {
  const res = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(valid()) });
  assert.equal(res.status, 201);
  const result = await res.json();
  assert.ok(validateVoucher(result));
  assert.equal(result.total, createDemoBooking(valid()).total);
  const get = await fetch(`${base}/api/bookings`);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
}));
test('API rechaza JSON roto, Content-Type incorrecto y ofertas inválidas con respuestas JSON', () => withServer(async base => {
  const broken = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
  assert.equal(broken.status, 400); assert.equal((await broken.json()).code, 'INVALID_JSON');
  const type = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
  assert.equal(type.status, 415);
  const noOffer = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...valid(), hotelId: 'fake' }) });
  assert.equal(noOffer.status, 400);
}));
test('Cliente POST usa JSON, valida el voucher y muestra errores del servidor', async () => {
  const voucher = createDemoBooking(valid());
  const fetchImpl = async (url, options) => {
    assert.equal(url, '/api/bookings'); assert.equal(options.method, 'POST');
    assert.equal(JSON.parse(options.body).destinationId, 'kioto');
    return { ok: true, status: 201, headers: { get: () => 'application/json' }, json: async () => voucher };
  };
  assert.equal((await submitDemoBooking(valid(), { fetchImpl })).bookingId, voucher.bookingId);
  await assert.rejects(() => submitDemoBooking(valid(), { fetchImpl: async () => ({ ok: false, status: 400, headers: { get: () => 'application/json' }, json: async () => ({ error: 'Selección inválida' }) }) }), /Selección inválida/);
});
test('Un vuelo por separado permite checkout, sin promociones de pack', () => {
  const data = createDemoBooking({ ...valid(), hotelId: null });
  assert.equal(data.flight.id, flight.id);
  assert.equal(data.hotel, null);
  assert.equal(data.total, flight.price * 2);
  assert.equal(data.packageDiscount, 0);
  assert.equal(data.favoriteDiscount, 0);
  assert.ok(validateVoucher(data));
  assert.match(voucherText(data), /Vuelo:/);
  assert.doesNotMatch(voucherText(data), /Hotel:/);
});
test('Un hotel por separado permite checkout, sin promociones de pack', () => {
  const data = createDemoBooking({ ...valid(), flightId: null });
  assert.equal(data.flight, null);
  assert.equal(data.hotel.id, hotel.id);
  assert.equal(data.total, hotel.nightlyPrice * 7);
  assert.equal(data.packageDiscount, 0);
  assert.ok(validateVoucher(data));
  assert.match(voucherText(data), /Hotel:/);
  assert.doesNotMatch(voucherText(data), /Vuelo:/);
});
test('Sin vuelo ni alojamiento no se puede confirmar, ni calcular precios', () => {
  assert.throws(() => createDemoBooking({ ...valid(), flightId: null, hotelId: null }), BookingError);
  assert.equal(calculateTripPrice({}), null);
});
