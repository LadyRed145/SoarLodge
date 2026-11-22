import test from 'node:test';
import assert from 'node:assert/strict';
import { flights, hotels } from '../server/travel-data.mjs';
import { buildTripSummary, datesMatch, emptyTripSelection, updateTripSelection } from '../src/lib/trip-selection.js';

const options = {
  flights: flights.filter((flight) => flight.destinationId === 'kioto'),
  hotels: hotels.filter((hotel) => hotel.destinationId === 'kioto'),
};
const choose = (selection, kind, index) => updateTripSelection(selection, kind, options[kind === 'flight' ? 'flights' : 'hotels'][index].id, options);

test('Se puede elegir un alojamiento disponible sin tener un vuelo seleccionado', () => {
  const next = choose(emptyTripSelection(), 'hotel', 0);
  assert.equal(next.hotelId, options.hotels[0].id);
  assert.equal(next.flightId, null);
  assert.equal(buildTripSummary(next, options).hotel.name, options.hotels[0].name);
});

test('Elegir vuelo y alojamiento en las mismas fechas completa el itinerario', () => {
  const selected = choose(choose(emptyTripSelection(), 'flight', 0), 'hotel', 0);
  const summary = buildTripSummary(selected, options);
  assert.equal(summary.complete, true);
  assert.equal(datesMatch(summary.flight, summary.hotel), true);
  assert.equal(summary.nights, 7);
  assert.equal(summary.flightTotal, options.flights[0].price);
  assert.equal(summary.hotelTotal, options.hotels[0].nightlyPrice * 7);
  assert.equal(summary.total, options.flights[0].price + options.hotels[0].nightlyPrice * 7);
});

test('Pulsar de nuevo en una opción seleccionada la retira', () => {
  const first = choose(emptyTripSelection(), 'hotel', 0);
  const removed = choose(first, 'hotel', 0);
  assert.equal(removed.hotelId, null);
  assert.equal(removed.flightId, null);
  assert.equal(buildTripSummary(removed, options).total, 0);
});

test('No se pueden elegir ofertas sin cupos, aunque invoquen el manejador', () => {
  // En Kioto la segunda oferta de cada tipo está agotada.
  const first = choose(emptyTripSelection(), 'hotel', 0);
  assert.equal(options.hotels[1].available, true); // hotel 2 sí está disponible en Kioto
  assert.equal(options.flights[1].available, false); // vuelo 2 no lo está
  const unchanged = choose(first, 'flight', 1);
  assert.equal(unchanged, first);
});

test('Cambiar de alojamiento a fechas distintas retira el vuelo incompatible y explica por qué', () => {
  const initial = choose(choose(emptyTripSelection(), 'flight', 0), 'hotel', 0);
  const next = choose(initial, 'hotel', 2);
  assert.equal(next.flightId, null);
  assert.equal(next.hotelId, options.hotels[2].id);
  assert.match(next.notice, /fechas no coinciden/i);
  assert.equal(buildTripSummary(next, options).complete, false);
});

test('Cambiar de vuelo a fechas distintas retira alojamiento incompatible y explica por qué', () => {
  // En Torres del Paine está disponible el segundo vuelo, pero no el segundo hotel.
  const paine = {
    flights: flights.filter((flight) => flight.destinationId === 'torres-del-paine'),
    hotels: hotels.filter((hotel) => hotel.destinationId === 'torres-del-paine'),
  };
  const firstHotel = updateTripSelection(emptyTripSelection(), 'hotel', paine.hotels[0].id, paine);
  const next = updateTripSelection(firstHotel, 'flight', paine.flights[2].id, paine);
  assert.equal(next.hotelId, null);
  assert.equal(next.flightId, paine.flights[2].id);
  assert.match(next.notice, /fechas no coinciden/i);
});

test('Ignora IDs inexistentes o tipos desconocidos sin alterar estado', () => {
  const prev = choose(emptyTripSelection(), 'hotel', 0);
  assert.equal(updateTripSelection(prev, 'hotel', 'inventado', options), prev);
  assert.equal(updateTripSelection(prev, 'taxi', prev.hotelId, options), prev);
});

test('Reiniciar la selección crea un estado independiente, sin fuga de destinos', () => {
  const previous = choose(emptyTripSelection(), 'hotel', 0);
  const reset = emptyTripSelection();
  assert.notEqual(previous, reset);
  assert.deepEqual(reset, { flightId: null, hotelId: null, notice: '' });
  assert.equal(buildTripSummary(reset, options).total, 0);
});

test('Total parcial considera solo la oferta seleccionada y mantiene el precio simulado correcto', () => {
  const flightOnly = choose(emptyTripSelection(), 'flight', 0);
  assert.equal(buildTripSummary(flightOnly, options).total, options.flights[0].price);
  const hotelOnly = choose(emptyTripSelection(), 'hotel', 0);
  assert.equal(buildTripSummary(hotelOnly, options).total, options.hotels[0].nightlyPrice * 7);
});

// El backend define disponibilidades mixtas por destino: cada uno debe tener opciones elegibles.
test('Todos los destinos mantienen al menos un vuelo y un hotel seleccionables en fechas coincidentes', () => {
  for (const destinationId of new Set(flights.map((flight) => flight.destinationId))) {
    const flight = flights.find((item) => item.destinationId === destinationId && item.available);
    const hotel = hotels.find((item) => item.destinationId === destinationId && item.available && datesMatch(flight, item));
    assert.ok(flight, `No hay vuelo disponible para ${destinationId}`);
    assert.ok(hotel, `No hay hotel compatible para ${destinationId}`);
  }
});
