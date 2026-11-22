import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { destinations, regions } from '../server/data.mjs';

async function withServer(callback) {
  const server = createServer(createHandler({ delayMs: 0 }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally { await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

test('GET /api/health identifica el servicio REST de Soarlodge', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.service, 'Soarlodge REST mock');
  assert.equal(body.status, 'ok');
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
}));

test('GET /api/destinations lista 9 destinos y su cantidad real', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.total, 9);
  assert.deepEqual(body.destinations.map((item) => item.id), destinations.map((item) => item.id));
}));

test('Cada destino tiene país, región, actividades y descripción', () => {
  assert.equal(new Set(destinations.map((item) => item.id)).size, destinations.length);
  for (const item of destinations) {
    assert.ok(item.country && item.description && item.name && item.location);
    assert.ok(item.activities.length >= 3);
    assert.ok(regions.some((region) => region.id === item.region));
    assert.match(item.image, /^\/destinations\/[a-z-]+\.svg$/);
  }
});

test('GET /api/regions lista las regiones sin inventar destinos', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/regions`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.total, 5);
  assert.deepEqual(body.regions, regions);
}));

test('GET /api/destinations permite filtrar por región', () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/destinations?region=asia`)).json();
  assert.equal(body.total, 2);
  assert.deepEqual(body.destinations.map((item) => item.id), ['kioto', 'bali']);
}));

test('GET /api/destinations busca país y actividades, tolera acentos y mayúsculas', () => withServer(async (base) => {
  const chile = await (await fetch(`${base}/api/destinations?q=CHILE`)).json();
  assert.deepEqual(chile.destinations.map((item) => item.id), ['torres-del-paine']);
  const sydney = await (await fetch(`${base}/api/destinations?q=Sidney`)).json();
  assert.deepEqual(sydney.destinations.map((item) => item.id), ['sydney']);
  const activities = await (await fetch(`${base}/api/destinations?q=termas`)).json();
  assert.equal(activities.total, 0);
  const search = await (await fetch(`${base}/api/destinations?q=senderismo`)).json();
  assert.deepEqual(search.destinations.map((item) => item.id), ['torres-del-paine']);
}));

test('GET /api/destinations entrega lista vacía sin lanzar 404 cuando no hay coincidencias', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations?q=un-destino-que-no-existe`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { destinations: [], total: 0 });
}));

test('GET /api/destinations rechaza una región que no existe', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations?region=marte`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'INVALID_REGION');
}));

test('GET /api/destinations/:id muestra el detalle correcto', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations/torres-del-paine`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.destination.country, 'Chile');
  assert.ok(body.destination.activities.includes('Senderismo'));
}));

test('GET /api/destinations/:id devuelve 404 explícito para identificador desconocido', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations/inexistente`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'DESTINATION_NOT_FOUND');
}));

test('Una URL con escape malformado devuelve JSON 400 sin tumbar el servidor', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/destinations/%E0%A4%A`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'BAD_REQUEST');
  assert.equal((await (await fetch(`${base}/api/health`)).json()).status, 'ok');
}));

test('Rutas desconocidas devuelven 404 con JSON', () => withServer(async (base) => {
  const response = await fetch(`${base}/api/no-existe`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'NOT_FOUND');
}));

test('Simulación de errores 404 y 500 para verificar interfaz', () => withServer(async (base) => {
  for (const status of [404, 500]) {
    const response = await fetch(`${base}/api/destinations?simulate=${status}`);
    assert.equal(response.status, status);
    assert.equal((await response.json()).code, 'SIMULATED_ERROR');
  }
}));

test('Las rutas de consulta rechazan POST con HTTP 405 y Allow GET', () => withServer(async (base) => {
  for (const path of ['/api/destinations', '/api/destinations/kioto', '/api/regions']) {
    const response = await fetch(`${base}${path}`, { method: 'POST' });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
  }
}));
