import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { flights, hotels } from '../server/travel-data.mjs';
import { buildTripSummary, emptyTripSelection, updateTripSelection } from '../src/lib/trip-selection.js';

test('Las tarjetas renderizan controles accesibles para elegir, quitar y bloquear ofertas sin cupos', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { HotelCard, FlightCard, TripSummary } = await vite.ssrLoadModule('/src/components/TravelOptions.jsx');
    const kiotoHotel = hotels.find((hotel) => hotel.destinationId === 'kioto' && hotel.available);
    const unavailableFlight = flights.find((flight) => flight.destinationId === 'kioto' && !flight.available);
    const availableFlight = flights.find((flight) => flight.destinationId === 'kioto' && flight.available);
    const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));

    const unselected = render(HotelCard, { hotel: kiotoHotel, selected: false });
    assert.match(unselected, /<button[^>]+aria-pressed="false"[^>]*>Elegir alojamiento<\/button>/);
    const selected = render(HotelCard, { hotel: kiotoHotel, selected: true });
    assert.match(selected, /<button[^>]+aria-pressed="true"[^>]*>✓ Quitar alojamiento<\/button>/);
    assert.match(selected, /offer-card hotel-card is-selected/);
    assert.match(render(FlightCard, { flight: unavailableFlight }), /disabled=""[^>]*>Vuelo no disponible<\/button>/);
    assert.match(render(FlightCard, { flight: availableFlight }), /Elegir vuelo<\/button>/);

    const options = { flights: [availableFlight], hotels: [kiotoHotel] };
    const withFlight = updateTripSelection(emptyTripSelection(), 'flight', availableFlight.id, options);
    const full = updateTripSelection(withFlight, 'hotel', kiotoHotel.id, options);
    const summary = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(TripSummary, { destinationName: 'Kioto', summary: buildTripSummary(full, options), notice: '', onClear: () => {} })));
    assert.match(summary, /2 de 2/);
    assert.match(summary, /Itinerario de demostración completo/);
    assert.match(summary, /Limpiar mi selección/);
    assert.match(summary, /Continuar al pago de prueba/);
  } finally {
    await vite.close();
  }
});
