import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { flights, hotels } from '../server/travel-data.mjs';
import { getTravelPeriods, createPlan } from '../src/lib/planner.js';

function verifyFormFields(html, expectedNames) {
  const formFields = [...html.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map((match) => match[0]);
  const relevant = formFields.filter((field) => expectedNames.some((name) => field.includes(`name="${name}"`)));
  assert.equal(relevant.length, expectedNames.length, 'Each expected control should appear once');
  const ids = new Set();
  for (const field of relevant) {
    const id = field.match(/\bid="([^"]+)"/)?.[1];
    const name = field.match(/\bname="([^"]+)"/)?.[1];
    assert.ok(id && name, `Form field should have id and name: ${field}`);
    assert.ok(!ids.has(id), `Duplicated id: ${id}`);
    ids.add(id);
    assert.ok(html.includes(`for="${id}"`), `Missing explicit label for ${id}`);
  }
}

test('Inicio y catálogo vinculan sus búsquedas a una etiqueta y un id/nombre', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: Home } = await vite.ssrLoadModule('/src/pages/Home.jsx');
    const { default: Catalog } = await vite.ssrLoadModule('/src/pages/Catalog.jsx');
    const home = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Home)));
    const catalog = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Catalog)));
    verifyFormFields(home, ['destinationSearch']);
    verifyFormFields(catalog, ['destinationSearch']);
  } finally { await vite.close(); }
});

test('Planificador usa nombres, identificadores y etiquetas de fechas, personas y habitaciones', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { PlannerControls } = await vite.ssrLoadModule('/src/components/TravelOptions.jsx');
    const options = {
      flights: flights.filter((flight) => flight.destinationId === 'kioto'),
      hotels: hotels.filter((hotel) => hotel.destinationId === 'kioto'),
    };
    const periods = getTravelPeriods(options.flights, options.hotels);
    const html = renderToStaticMarkup(React.createElement(PlannerControls, {
      periods, settings: createPlan('kioto', periods[0].value), onChange: () => {},
    }));
    verifyFormFields(html, ['travelPeriod', 'travelers', 'rooms']);
  } finally { await vite.close(); }
});

test('Checkout tiene etiquetas explícitas y nombre en todos sus controles, sin tocar su lógica', () => {
  const content = readFileSync(new URL('../src/pages/Checkout.jsx', import.meta.url), 'utf8');
  for (const [id, name] of [
    ['checkout-customer-name', 'customerName'],
    ['checkout-customer-email', 'customerEmail'],
    ['checkout-method-card', 'method'],
    ['checkout-method-transfer', 'method'],
    ['checkout-accept-demo', 'acceptDemo'],
  ]) {
    assert.ok(content.includes(`htmlFor="${id}"`), `Missing explicit checkout label for ${id}`);
    assert.match(content, new RegExp(`\\bid="${id}"[^>]*\\bname="${name}"|\\bname="${name}"[^>]*\\bid="${id}"`));
  }
  assert.ok(content.includes('submitDemoBooking('), 'Do not remove checkout logic');
});
