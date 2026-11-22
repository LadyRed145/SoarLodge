/** Smoke test de REST/GraphQL/checkout por HTTP, sin red externa ni cargos reales.
 * Ejecutar con npm run smoke:api. Falla con exit code 1 ante regresiones.
 */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { validateVoucher } from '../src/lib/booking.js';

const server = createServer(createHandler({ delayMs: 0 }));
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const base = `http://127.0.0.1:${server.address().port}`;
const graphqlQuery = `query Options($destinationId: ID!) {
  flights(destinationId:$destinationId) { id departureDate returnDate available seatsLeft }
  hotels(destinationId:$destinationId) { id checkIn checkOut available roomsLeft }
}`;

async function request(path, options) {
  const response = await fetch(base + path, options);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  return { status: response.status, body: await response.json() };
}
const jsonPost = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

try {
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.status, 'ok');
  console.log('✓ REST /api/health responde 200');

  const listing = await request('/api/destinations');
  assert.equal(listing.status, 200);
  assert.equal(listing.body.total, 9);
  const destination = listing.body.destinations.find((item) => item.id === 'kioto');
  assert.ok(destination);
  console.log('✓ REST entrega nueve destinos');

  const options = await request('/graphql', jsonPost({ query: graphqlQuery, variables: { destinationId: destination.id } }));
  assert.equal(options.status, 200);
  const flight = options.body.data.flights.find((item) => item.available && item.seatsLeft >= 1);
  const hotel = options.body.data.hotels.find((item) => item.available && item.roomsLeft >= 1 && item.checkIn === flight.departureDate && item.checkOut === flight.returnDate);
  assert.ok(flight && hotel);
  console.log('✓ GraphQL devuelve vuelos y hoteles compatibles');

  const checkout = await request('/api/bookings', jsonPost({
    destinationId: destination.id, flightId: flight.id, hotelId: hotel.id, travelers: 1,
    rooms: 1, favorite: true, paymentMethod: 'demo-transfer',
    customer: { name: 'Cliente Demo', email: 'demo@example.test' },
  }));
  assert.equal(checkout.status, 201);
  assert.ok(validateVoucher(checkout.body));
  assert.ok(checkout.body.total > 0);
  console.log('✓ Checkout DEMO genera voucher válido, sin cobrar');

  const invalid = await request('/api/destinations/no-existe');
  assert.equal(invalid.status, 404);
  assert.ok(invalid.body.code);
  console.log('✓ API devuelve errores controlados y código HTTP correcto');
  console.log('\n✈ Soarlodge: smoke API completo sin errores.');
} catch (error) {
  console.error('✖ Falló smoke:api:', error);
  process.exitCode = 1;
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
