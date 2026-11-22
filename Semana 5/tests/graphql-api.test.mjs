import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { executeGraphQL } from '../server/graphql-engine.mjs';
import { flights, hotels } from '../server/travel-data.mjs';
import { destinations } from '../server/data.mjs';
import { validateTravelOptions } from '../src/lib/travel-options.js';

const query = `query TravelOptions($destinationId: ID!) {
  flights(destinationId: $destinationId) { id destinationId airline flightNumber origin arrival departureDate returnDate price currency available seatsLeft }
  hotels(destinationId: $destinationId) { id destinationId name location checkIn checkOut nightlyPrice currency amenities available roomsLeft }
}`;

async function withServer(callback) {
  const server = createServer(createHandler({ delayMs: 0 }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { return await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve())); }
}

const post = (base, body, headers = { 'Content-Type': 'application/json' }) => fetch(`${base}/graphql`, { method: 'POST', headers, body: JSON.stringify(body) });

test('Hay 6 vuelos y 6 hoteles para cada uno de los 9 destinos (3 períodos, 2 alternativas)', () => {
  assert.equal(flights.length, destinations.length * 6);
  assert.equal(hotels.length, destinations.length * 6);
  for (const destination of destinations) {
    const options = executeGraphQL(query, { destinationId: destination.id });
    assert.equal(options.flights.length, 6);
    assert.equal(options.hotels.length, 6);
    assert.equal(validateTravelOptions(options, destination.id), true);
  }
});

test('POST /graphql devuelve ambos recursos filtrados por ID del destino', () => withServer(async (base) => {
  const response = await post(base, { query, variables: { destinationId: 'kioto' } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const payload = await response.json();
  assert.deepEqual(Object.keys(payload.data).sort(), ['flights', 'hotels']);
  assert.equal(payload.data.flights.length, 6);
  assert.equal(payload.data.hotels.length, 6);
  assert.ok(payload.data.flights.every((flight) => flight.arrival === 'Osaka-Kansai (KIX)'));
  assert.ok(payload.data.hotels.some((hotel) => hotel.name === 'Jardines de Kamo'));
}));

test('GraphQL devuelve únicamente los campos seleccionados y permite alias', () => withServer(async (base) => {
  const response = await post(base, { query: 'query { opciones: hotels(destinationId:"bali") { id name nightlyPrice } }' });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(Object.keys(body.data), ['opciones']);
  assert.deepEqual(Object.keys(body.data.opciones[0]), ['id', 'name', 'nightlyPrice']);
  assert.ok(!Object.hasOwn(body.data.opciones[0], 'roomsLeft'));
}));

test('Los destinos inexistentes devuelven arrays vacíos, no datos ajenos', () => {
  const data = executeGraphQL(query, { destinationId: 'marte' });
  assert.deepEqual(data, { flights: [], hotels: [] });
});

test('Las consultas sin variables obligatorias se rechazan', () => withServer(async (base) => {
  const response = await post(base, { query });
  assert.equal(response.status, 400);
  assert.match((await response.json()).errors[0].message, /variable obligatoria/i);
}));

test('La API rechaza campos inexistentes y consultas malformadas', () => withServer(async (base) => {
  for (const bad of ['{ hotels(destinationId:"kioto") { precioInventado } }', '{ hotel(destinationId:"kioto") { id } }', '{ flights { id } }', 'query {', 'mutation { vuelos }']) {
    const response = await post(base, { query: bad });
    assert.equal(response.status, 400, `Consulta inválida: ${bad}`);
    assert.ok(Array.isArray((await response.json()).errors));
  }
}));

test('GraphQL rechaza variables sin declarar y variables con tipo incorrecto', () => {
  assert.throws(() => executeGraphQL('{ flights(destinationId: $id) { id } }', { id: 'kioto' }), /no está definida/);
  assert.throws(() => executeGraphQL(query, { destinationId: 12 }), /Tipo inválido/);
});

test('Rechaza método GET y Content-Type distinto de JSON', () => withServer(async (base) => {
  const get = await fetch(`${base}/graphql`);
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
  const wrong = await post(base, { query }, { 'Content-Type': 'text/plain' });
  assert.equal(wrong.status, 415);
}));

test('Cuerpos JSON inválidos son 400 sin afectar el servidor REST', () => withServer(async (base) => {
  const response = await fetch(`${base}/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
  assert.equal(response.status, 400);
  assert.equal((await (await fetch(`${base}/api/health`)).json()).status, 'ok');
}));

test('Mensajes GraphQL superiores a 20 KB son rechazados con 413', () => withServer(async (base) => {
  const response = await post(base, { query: 'query {' + ' '.repeat(23_000) + '}' });
  assert.equal(response.status, 413);
}));

test('No confunde solicitudes para distintos destinos', () => {
  const chile = executeGraphQL(query, { destinationId: 'torres-del-paine' });
  const portugal = executeGraphQL(query, { destinationId: 'lisboa' });
  assert.notDeepEqual(chile.hotels.map((h) => h.name), portugal.hotels.map((h) => h.name));
  assert.ok(chile.hotels.every((h) => h.destinationId === 'torres-del-paine'));
});

test('El contrato de disponibilidad detecta cupos contradictorios y tarifas incompletas', () => {
  const data = executeGraphQL(query, { destinationId: 'banff' });
  assert.equal(validateTravelOptions(data, 'banff'), true);
  assert.equal(validateTravelOptions({ ...data, hotels: [{ ...data.hotels[0], roomsLeft: 0 }] }, 'banff'), false);
  assert.equal(validateTravelOptions({ ...data, flights: [{ ...data.flights[0], price: -20 }] }, 'banff'), false);
  assert.equal(validateTravelOptions(data, 'kioto'), false);
});


test('No acepta nombres heredados de Object como campos de Query', () => {
  assert.throws(() => executeGraphQL('{ constructor(destinationId: "kioto") { id } }'), /No existe la consulta/);
  assert.throws(() => executeGraphQL('{ __proto__(destinationId: "kioto") { id } }'), /No existe la consulta/);
});
