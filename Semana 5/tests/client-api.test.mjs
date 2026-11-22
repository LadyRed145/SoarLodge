import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, clearApiCache, getResource, requestJSON } from '../src/lib/api.js';

const valid = { destinations: [{ id:'kioto', name:'Kioto', country:'Japón', region:'asia', description:'Templos', activities:['Jardines'] }], total: 1 };
const ok = (body, contentType = 'application/json; charset=utf-8') => ({ ok: true, status: 200, headers: { get: () => contentType }, json: async () => body });
const notOk = (status) => ({ ok: false, status, headers: { get: () => 'application/json' } });

test('requestJSON recibe y analiza destinos desde JSON', async () => {
  assert.deepEqual(await requestJSON('/api/destinations', { fetchImpl: async () => ok(valid) }), valid);
});

test('requestJSON transforma 404 y 500 en ApiError de interfaz', async () => {
  for (const status of [404, 500]) {
    await assert.rejects(requestJSON('/api/fail', { fetchImpl: async () => notOk(status) }), (error) => error instanceof ApiError && error.status === status && Boolean(error.message));
  }
});

test('requestJSON transforma desconexión en error de red', async () => {
  await assert.rejects(requestJSON('/api/fail', { fetchImpl: async () => { throw new TypeError('NetworkError'); } }), (error) => error instanceof ApiError && error.code === 'NETWORK_ERROR');
});

test('requestJSON transforma AbortError en mensaje TIMEOUT', async () => {
  await assert.rejects(requestJSON('/api/destinations', { fetchImpl: async () => { throw Object.assign(new Error('Aborted'), { name: 'AbortError' }); } }), (error) => error.code === 'TIMEOUT');
});

test('requestJSON rechaza content-type no JSON', async () => {
  await assert.rejects(requestJSON('/api/destinations', { fetchImpl: async () => ok(valid, 'text/html') }), (error) => error.code === 'INVALID_RESPONSE');
});

test('requestJSON rechaza JSON malformado y respuestas incompletas', async () => {
  await assert.rejects(requestJSON('/api/destinations', { fetchImpl: async () => ({ ...ok(valid), json: async () => { throw new SyntaxError('JSON bad'); } }) }), (error) => error.code === 'INVALID_JSON');
  await assert.rejects(requestJSON('/api/destinations', { fetchImpl: async () => ok({ destinations: [{ id: 'kioto' }], total: 1 }) }), (error) => error.code === 'INVALID_RESPONSE');
});

test('La caché comparte peticiones concurrentes y evita consultas repetidas', async () => {
  clearApiCache();
  let calls = 0;
  const fakeFetch = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 5)); return ok(valid); };
  const first = getResource('/api/destinations', { fetchImpl: fakeFetch });
  const second = getResource('/api/destinations', { fetchImpl: fakeFetch });
  assert.equal(first, second, 'Ambas vistas deben compartir una petición pendiente');
  await Promise.all([first, second]);
  await getResource('/api/destinations', { fetchImpl: fakeFetch });
  assert.equal(calls, 1, 'La respuesta se reutiliza dentro de su TTL');
  await getResource('/api/destinations', { fetchImpl: fakeFetch, force: true });
  assert.equal(calls, 2, 'La recarga manual evita la caché');
  clearApiCache();
});

test('Una respuesta fallida no queda almacenada en caché', async () => {
  clearApiCache();
  let calls = 0;
  const fakeFetch = async () => { calls++; return calls === 1 ? notOk(500) : ok(valid); };
  await assert.rejects(getResource('/api/destinations', { fetchImpl: fakeFetch }));
  assert.deepEqual(await getResource('/api/destinations', { fetchImpl: fakeFetch }), valid);
  assert.equal(calls, 2);
  clearApiCache();
});

test('Borrar caché por URL no borra otras rutas', async () => {
  clearApiCache();
  let calls = 0;
  const fakeFetch = async () => { calls++; return ok({ status: 'ok' }); };
  await getResource('/api/a', { fetchImpl: fakeFetch });
  await getResource('/api/b', { fetchImpl: fakeFetch });
  clearApiCache('/api/a');
  await getResource('/api/b', { fetchImpl: fakeFetch });
  await getResource('/api/a', { fetchImpl: fakeFetch });
  assert.equal(calls, 3);
  clearApiCache();
});
