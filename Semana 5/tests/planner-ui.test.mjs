import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { hotels, flights } from '../server/travel-data.mjs';
import { buildTripSummary, emptyTripSelection } from '../src/lib/trip-selection.js';
import { getTravelPeriods, createPlan } from '../src/lib/planner.js';

test('Formulario de viaje renderiza fechas, viajeros y habitaciones con etiquetas', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { PlannerControls } = await vite.ssrLoadModule('/src/components/TravelOptions.jsx');
    const options = { flights: flights.filter((item) => item.destinationId === 'kioto'), hotels: hotels.filter((item) => item.destinationId === 'kioto') };
    const periods = getTravelPeriods(options.flights, options.hotels);
    const markup = renderToStaticMarkup(React.createElement(PlannerControls, { periods, settings: createPlan('kioto', periods[0].value), onChange: () => {} }));
    assert.match(markup, /Fechas de viaje/);
    assert.match(markup, /Viajeros/);
    assert.match(markup, /Habitaciones/);
    assert.equal((markup.match(/<select/g) ?? []).length, 3);
    assert.match(markup, /2027-03-12/);
  } finally { await vite.close(); }
});

test('Hotel muestra fotografía referencial con respaldo local, precio por estadía y resumen enlazado', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { HotelCard, TripSummary } = await vite.ssrLoadModule('/src/components/TravelOptions.jsx');
    const hotel = hotels.find((item) => item.destinationId === 'kioto');
    const card = renderToStaticMarkup(React.createElement(HotelCard, { hotel }));
    assert.match(card, /images\.unsplash\.com/);
    assert.match(card, /Imagen referencial/);
    assert.match(card, /no corresponde a una propiedad real/);
    assert.match(card, /por habitación \/ estadía/);
    const summary = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(TripSummary, {
      destinationName: 'Kioto', summary: buildTripSummary(emptyTripSelection(), { hotels: [hotel] }), compact: true,
    })));
    assert.match(summary, /Ver resumen completo/);
    assert.match(summary, /\/mi-viaje/);
  } finally { await vite.close(); }
});
