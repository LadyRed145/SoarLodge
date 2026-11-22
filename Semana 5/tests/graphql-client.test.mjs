import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, clearGraphQLCache, getGraphQLResource, requestGraphQL } from '../src/lib/api.js';

const query = 'query($id:ID!) { flights(destinationId:$id) { id } }';
const variables = { id: 'kioto' };
const success = { data: { flights: [{ id: 'vuelo-1' }] } };
const response = (payload, status = 200, contentType = 'application/json') => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: () => contentType },
  json: async () => payload,
});

test('El cliente envía POST con query GraphQL y variables JSON, sin usar REST GET', async () => {
  let request;
  const data = await requestGraphQL(query, variables, { fetchImpl: async (url, init) => { request = { url, init }; return response(success); } });
  assert.equal(request.url, '/graphql');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.init.body), { query, variables });
  assert.deepEqual(data, success.data);
});

test('Errores GraphQL se convierten en ApiError legibles', async () => {
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => response({ errors: [{ message: 'Destino incorrecto' }] }, 400) }), (err) => err instanceof ApiError && err.code === 'GRAPHQL_ERROR' && /Destino incorrecto/.test(err.message));
});

test('El cliente detecta error de red, tiempo de espera y respuesta sin JSON', async () => {
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => { throw new TypeError('offline'); } }), (err) => err.code === 'NETWORK_ERROR');
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => { throw Object.assign(new Error('abort'), { name: 'AbortError' }); } }), (err) => err.code === 'TIMEOUT');
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => response(success, 200, 'text/html') }), (err) => err.code === 'INVALID_RESPONSE');
});

test('GraphQL rechaza respuestas sin data y JSON roto', async () => {
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => response({}) }), (err) => err.code === 'INVALID_RESPONSE');
  await assert.rejects(requestGraphQL(query, variables, { fetchImpl: async () => ({ ...response(success), json: async () => { throw new SyntaxError('malformed'); } }) }), (err) => err.code === 'INVALID_JSON');
});

test('Caché GraphQL une peticiones simultáneas para el mismo destino', async () => {
  clearGraphQLCache();
  let calls = 0;
  const fetchImpl = async () => { calls++; await new Promise((resolve) => setTimeout(resolve, 5)); return response(success); };
  const first = getGraphQLResource(query, variables, { fetchImpl });
  const second = getGraphQLResource(query, { ...variables }, { fetchImpl });
  assert.equal(first, second);
  await Promise.all([first, second]);
  await getGraphQLResource(query, variables, { fetchImpl });
  assert.equal(calls, 1);
  await getGraphQLResource(query, variables, { fetchImpl, force: true });
  assert.equal(calls, 2);
  clearGraphQLCache();
});

test('Distintas variables GraphQL no comparten resultados en caché', async () => {
  clearGraphQLCache();
  let calls = 0;
  const fetchImpl = async () => { calls++; return response(success); };
  await getGraphQLResource(query, { id: 'kioto' }, { fetchImpl });
  await getGraphQLResource(query, { id: 'lisboa' }, { fetchImpl });
  assert.equal(calls, 2);
  clearGraphQLCache();
});

test('GraphQL no guarda errores en caché', async () => {
  clearGraphQLCache();
  let calls = 0;
  const fetchImpl = async () => { calls++; return calls === 1 ? response({ errors: [{ message: 'error de prueba' }] }, 400) : response(success); };
  await assert.rejects(getGraphQLResource(query, variables, { fetchImpl }));
  assert.deepEqual(await getGraphQLResource(query, variables, { fetchImpl }), success.data);
  assert.equal(calls, 2);
  clearGraphQLCache();
});
