/** Recorridos integrados REALES por HTTP contra el mock local.
 * A diferencia de las pruebas aisladas, verifican REST -> GraphQL -> checkout -> voucher.
 * No realizan cargos, ni escriben datos de clientes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { destinations } from '../server/data.mjs';
import { calculateTripPrice } from '../src/lib/pricing.js';
import { validateVoucher } from '../src/lib/booking.js';

const QUERY = `query TravelOptions($destinationId: ID!) {
  flights(destinationId: $destinationId) {
    id destinationId airline flightNumber origin arrival departureDate returnDate
    price currency available seatsLeft
  }
  hotels(destinationId: $destinationId) {
    id destinationId name location checkIn checkOut nightlyPrice currency
    amenities available roomsLeft
  }
}`;

async function withServer(task) {
  const server = createServer(createHandler({ delayMs: 0 }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { return await task(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())); }
}

const gql = (base, destinationId) => fetch(`${base}/graphql`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: QUERY, variables: { destinationId } }),
});
const booking = (base, payload) => fetch(`${base}/api/bookings`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const person = { name: 'Viajera Prueba', email: 'vuelo@example.test' };

for (const destination of destinations) {
  test(`Flujo completo por HTTP: ${destination.name} -> REST + GraphQL + pack + voucher`, () => withServer(async (base) => {
    const result = await fetch(`${base}/api/destinations/${destination.id}`);
    assert.equal(result.status, 200);
    const detail = (await result.json()).destination;
    assert.equal(detail.id, destination.id);
    assert.ok(detail.country && detail.activities.length);

    const offersResponse = await gql(base, destination.id);
    assert.equal(offersResponse.status, 200);
    const offers = (await offersResponse.json()).data;
    assert.equal(offers.flights.length, 6);
    assert.equal(offers.hotels.length, 6);
    const flight = offers.flights.find((item) => item.available && item.seatsLeft >= 2);
    const hotel = offers.hotels.find((item) => item.available && item.roomsLeft >= 1 &&
      item.checkIn === flight?.departureDate && item.checkOut === flight?.returnDate);
    assert.ok(flight && hotel, 'Debe existir al menos un pack con fechas y cupos compatibles');

    const input = {
      destinationId: destination.id, flightId: flight.id, hotelId: hotel.id,
      travelers: 2, rooms: 1, favorite: true, paymentMethod: 'demo-card',
      customer: person, total: -999999, packageDiscount: 999999,
    };
    const payment = await booking(base, input);
    assert.equal(payment.status, 201);
    const voucher = await payment.json();
    const expected = calculateTripPrice({ flight, hotel, travelers: 2, rooms: 1, favorite: true });
    assert.equal(voucher.mode, 'DEMO');
    assert.equal(voucher.destinationId, destination.id);
    assert.equal(voucher.total, expected.total, 'El servidor debe recalcular, sin creer el precio del cliente');
    assert.equal(voucher.packageDiscount, expected.packageDiscount);
    assert.equal(voucher.favoriteDiscount, expected.favoriteDiscount);
    assert.ok(validateVoucher(voucher));
    assert.doesNotMatch(JSON.stringify(voucher), /vuelo@example\.test|Viajera Prueba/);
    assert.match(voucher.message, /demostración/i);
  }));
}

test('HTTP integra vuelo solo y hotel solo, sin descuento de pack', () => withServer(async (base) => {
  const offers = (await (await gql(base, 'kioto')).json()).data;
  const flight = offers.flights.find((x) => x.available);
  const hotel = offers.hotels.find((x) => x.available);
  for (const [flightId, hotelId] of [[flight.id, null], [null, hotel.id]]) {
    const response = await booking(base, {
      destinationId: 'kioto', flightId, hotelId, travelers: 2, rooms: 1,
      favorite: true, paymentMethod: 'demo-transfer', customer: person,
    });
    assert.equal(response.status, 201);
    const voucher = await response.json();
    assert.equal(voucher.isPackage, false);
    assert.equal(voucher.packageDiscount, 0);
    assert.equal(voucher.favoriteDiscount, 0);
    assert.ok(validateVoucher(voucher));
  }
}));

test('HTTP rechaza un pack sin cupos y permite consultar otro destino después', () => withServer(async (base) => {
  const offers = (await (await gql(base, 'kioto')).json()).data;
  const full = offers.flights.find((x) => !x.available);
  assert.ok(full);
  const response = await booking(base, {
    destinationId: 'kioto', flightId: full.id, hotelId: null,
    travelers: 1, rooms: 1, favorite: false, paymentMethod: 'demo-card', customer: person,
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'NO_AVAILABILITY');
  const valid = await gql(base, 'bali');
  assert.equal(valid.status, 200);
  assert.equal((await valid.json()).data.flights.length, 6);
}));

test('HTTP no mezcla destinos al ejecutar consultas GraphQL concurrentes', () => withServer(async (base) => {
  const responses = await Promise.all(destinations.map(({ id }) => gql(base, id)));
  const payloads = await Promise.all(responses.map((response) => response.json()));
  for (const [index, response] of responses.entries()) {
    assert.equal(response.status, 200);
    const { id } = destinations[index];
    assert.ok(payloads[index].data.flights.every((flight) => flight.destinationId === id));
    assert.ok(payloads[index].data.hotels.every((hotel) => hotel.destinationId === id));
  }
}));

test('HTTP devuelve errores JSON de REST, GraphQL y checkout y sigue saludable', () => withServer(async (base) => {
  const rest = await fetch(`${base}/api/destinations/no-existe`);
  assert.equal(rest.status, 404);
  assert.equal((await rest.json()).code, 'DESTINATION_NOT_FOUND');
  const graphql = await fetch(`${base}/graphql`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ flights(destinationId:"kioto") { noExiste } }' }),
  });
  assert.equal(graphql.status, 400);
  assert.ok((await graphql.json()).errors.length);
  const invalidBooking = await booking(base, {
    destinationId: 'kioto', travelers: 1, rooms: 1,
    favorite: false, paymentMethod: 'demo-card', customer: person,
  });
  assert.equal(invalidBooking.status, 400);
  assert.equal((await invalidBooking.json()).code, 'INVALID_OFFERS');
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
}));
