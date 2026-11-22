import test from 'node:test';
import assert from 'node:assert/strict';
import { destinations } from '../server/data.mjs';
import { filterDestinations, sortDestinations, groupDestinationsByRegion, normalizeText, validateDestinationPayload } from '../src/lib/destinations.js';

test('Normalización ignora acentos, mayúsculas y espacios laterales', () => {
  assert.equal(normalizeText('  SÍDNEY  '), 'sidney');
  assert.equal(normalizeText('CAFÉ'), 'cafe');
});

test('Filtra por región sin mutar datos originales', () => {
  const before = [...destinations];
  assert.deepEqual(filterDestinations(destinations, { region: 'africa' }).map((item) => item.id), ['marrakech']);
  assert.deepEqual(destinations, before);
});

test('Búsqueda local encuentra nombres, países y actividades sin diferenciar acentos', () => {
  assert.deepEqual(filterDestinations(destinations, { search: 'SÍDNEY' }).map((item) => item.id), ['sydney']);
  assert.deepEqual(filterDestinations(destinations, { search: 'japón' }).map((item) => item.id), ['kioto']);
  assert.deepEqual(filterDestinations(destinations, { search: 'ARQUITECTURA' }).map((item) => item.id), ['lisboa','sydney']);
});

test('Combina región y búsqueda sin pedir nuevos datos al servidor', () => {
  assert.deepEqual(filterDestinations(destinations, { region: 'asia', search: 'templo' }).map((item) => item.id), ['kioto', 'bali']);
  assert.deepEqual(filterDestinations(destinations, { region: 'europa', search: 'banff' }), []);
});

test('Ordenamiento alfabético por destino, país y región', () => {
  const first = destinations[0];
  const last = destinations.at(-1);
  assert.equal(sortDestinations(destinations, 'name')[0].name, 'Bali');
  assert.equal(sortDestinations(destinations, 'country')[0].country, 'Australia');
  assert.equal(sortDestinations(destinations, 'region')[0].region, 'africa');
  assert.equal(destinations[0], first);
  assert.equal(destinations.at(-1), last);
});

test('Funciones de filtros toleran búsquedas vacías y entradas no listas', () => {
  assert.equal(filterDestinations(destinations, { search: '    ' }).length, destinations.length);
  assert.deepEqual(filterDestinations(null), []);
});

test('Valida un listado REST correcto y rechaza totales inconsistentes', () => {
  assert.equal(validateDestinationPayload('/api/destinations', { destinations, total: destinations.length }), true);
  assert.equal(validateDestinationPayload('/api/destinations', { destinations, total: 100 }), false);
});

test('Valida los detalles y rechaza actividades mal tipadas', () => {
  assert.equal(validateDestinationPayload('/api/destinations/kioto', { destination: destinations[1] }), true);
  assert.equal(validateDestinationPayload('/api/destinations/kioto', { destination: { ...destinations[1], activities: [1] } }), false);
});

test('Valida la lista de regiones', () => {
  assert.equal(validateDestinationPayload('/api/regions', { regions: [{ id: 'asia', name: 'Asia' }] }), true);
  assert.equal(validateDestinationPayload('/api/regions', { regions: [{ id: 7, name: 'Asia' }] }), false);
});


test('Región A–Z muestra encabezados con sus destinos sin alterar el orden', () => {
  const sorted = sortDestinations(destinations, 'region');
  const groups = groupDestinationsByRegion(sorted);
  assert.deepEqual(groups.map((g) => g.id), ['africa', 'america', 'asia', 'europa', 'oceania']);
  assert.deepEqual(groups.map((g) => g.destinations.map((d) => d.id)), [
    ['marrakech'], ['banff', 'tofino', 'torres-del-paine'],
    ['bali', 'kioto'], ['lisboa', 'reikiavik'], ['sydney'],
  ]);
  assert.deepEqual(groups.flatMap((g) => g.destinations), sorted);
  assert.deepEqual(groupDestinationsByRegion(null), []);
  assert.deepEqual(groupDestinationsByRegion([]), []);
});

test('La búsqueda y el filtro por región muestran solo grupos y recuentos presentes', () => {
  const matches = sortDestinations(filterDestinations(destinations, { search: 'templo' }), 'region');
  const groups = groupDestinationsByRegion(matches);
  assert.deepEqual(groups.map((g) => [g.id, g.destinations.length]), [['asia', 2]]);
  const selected = sortDestinations(filterDestinations(destinations, { region: 'america' }), 'region');
  assert.deepEqual(groupDestinationsByRegion(selected).map((g) => [g.id, g.destinations.length]), [['america', 3]]);
  assert.equal(filterDestinations(destinations, { search: '__nada__' }).length, 0);
});
