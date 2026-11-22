import test from 'node:test';
import assert from 'node:assert/strict';
import { flights, hotels, datePairs } from '../server/travel-data.mjs';
import {
  canChooseOffer, clampInt, createPlan, filterOffersByPeriod, getTravelPeriods,
  normalizeStoredPlan, readStoredPlan, STORAGE_KEY, updatePlannerSettings,
} from '../src/lib/planner.js';
import { buildTripSummary, updateTripSelection } from '../src/lib/trip-selection.js';

const destinationId = 'kioto';
const options = { flights: flights.filter((f) => f.destinationId === destinationId), hotels: hotels.filter((h) => h.destinationId === destinationId) };
const [firstFlight] = options.flights;
const [firstHotel] = options.hotels;

test('Cada destino ofrece tres períodos y dos alternativas por fecha y tipo', () => {
  const periods = getTravelPeriods(options.flights, options.hotels);
  assert.equal(periods.length, 3);
  assert.deepEqual(periods.map((p) => p.value), datePairs.map((p) => p.departure));
  for (const period of periods) {
    assert.equal(filterOffersByPeriod(options.flights, period.value, 'flight').length, 2);
    assert.equal(filterOffersByPeriod(options.hotels, period.value, 'hotel').length, 2);
  }
});

test('Cambia período sin arrastrar selecciones incompatibles', () => {
  const initial = { ...createPlan('kioto', datePairs[0].departure), flightId: firstFlight.id, hotelId: firstHotel.id };
  const updated = updatePlannerSettings(initial, 'period', datePairs[1].departure, options);
  assert.equal(updated.period, datePairs[1].departure);
  assert.equal(updated.flightId, null);
  assert.equal(updated.hotelId, null);
  assert.match(updated.notice, /actualizamos las fechas/i);
  assert.equal(updatePlannerSettings(initial, 'period', 'fecha-falsa', options), initial);
});

test('Calcula correctamente viajeros × vuelo y habitaciones × noches', () => {
  const plan = { ...createPlan('kioto', datePairs[0].departure), travelers: 3, rooms: 2, flightId: firstFlight.id, hotelId: firstHotel.id };
  const summary = buildTripSummary(plan, options, plan);
  assert.equal(summary.complete, true);
  assert.equal(summary.nights, 7);
  assert.equal(summary.flightTotal, firstFlight.price * 3);
  assert.equal(summary.hotelTotal, firstHotel.nightlyPrice * 7 * 2);
  assert.equal(summary.total, firstFlight.price * 3 + firstHotel.nightlyPrice * 14);
});

test('Bloquea ofertas con cupos inferiores al grupo aunque existan asientos o habitaciones', () => {
  const flight = options.flights.find((f) => f.available && f.seatsLeft >= 1);
  const hotel = options.hotels.find((h) => h.available && h.roomsLeft <= 2);
  assert.ok(flight);
  assert.ok(hotel);
  assert.equal(canChooseOffer('flight', flight, { travelers: flight.seatsLeft + 1 }), false);
  assert.equal(canChooseOffer('hotel', hotel, { rooms: hotel.roomsLeft + 1 }), false);
  assert.equal(canChooseOffer('hotel', hotel, { rooms: 1 }), true);
});

test('Al aumentar el grupo se quitan selecciones que ya no tienen cupos', () => {
  const scarce = options.hotels.find((h) => h.available && h.roomsLeft === 2);
  assert.ok(scarce);
  const plan = { ...createPlan('kioto', scarce.checkIn), hotelId: scarce.id, rooms: 2 };
  const updated = updatePlannerSettings(plan, 'rooms', 3, options);
  assert.equal(updated.hotelId, null);
  assert.match(updated.notice, /habitaciones/i);
});

test('La configuración se limita a rangos seguros y valores enteros', () => {
  assert.equal(clampInt('20', 1, 6), 6);
  assert.equal(clampInt('NaN', 1, 6), 1);
  const plan = updatePlannerSettings(createPlan('kioto', datePairs[0].departure), 'travelers', 50, options);
  assert.equal(plan.travelers, 6);
  assert.equal(updatePlannerSettings(plan, 'desconocido', 3, options), plan);
});

test('El almacenamiento restituye un plan válido sin información personal', () => {
  const saved = { ...createPlan('kioto', datePairs[0].departure), travelers: 2, rooms: 1, hotelId: firstHotel.id, notice: 'interno' };
  assert.equal(STORAGE_KEY, 'soarlodge:plan:v1');
  const restored = readStoredPlan(JSON.stringify(saved));
  assert.equal(restored.destinationId, 'kioto');
  assert.equal(restored.hotelId, firstHotel.id);
  assert.equal(restored.travelers, 2);
  assert.equal(restored.notice, '');
});

test('El almacenamiento corrupto o manipulado no rompe el planificador', () => {
  assert.deepEqual(readStoredPlan('no soy json'), createPlan());
  assert.deepEqual(normalizeStoredPlan(null), createPlan());
  const corrupted = readStoredPlan(JSON.stringify({ destinationId: '<script>', travelers: -8, rooms: 80, flightId: 52, period: 'ayer' }));
  assert.equal(corrupted.destinationId, null);
  assert.equal(corrupted.travelers, 1);
  assert.equal(corrupted.rooms, 4);
  assert.equal(corrupted.period, '');
  assert.equal(corrupted.flightId, null);
});

test('Ofertas caducas o desconocidas no generan un total ficticio incorrecto', () => {
  const state = { ...createPlan('kioto', datePairs[0].departure), flightId: 'inventado', hotelId: firstHotel.id };
  const summary = buildTripSummary(state, options, state);
  assert.equal(summary.flight, null);
  assert.equal(summary.hotel.name, firstHotel.name);
  assert.equal(summary.complete, false);
});
