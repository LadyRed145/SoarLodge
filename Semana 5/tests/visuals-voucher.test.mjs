import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { destinations } from '../server/data.mjs';
import { flights, hotels } from '../server/travel-data.mjs';
import { createDemoBooking } from '../server/bookings.mjs';
import { destinationPhotoIds, destinationVisual, hotelVisual } from '../src/lib/visuals.js';

const base = fileURLToPath(new URL('../', import.meta.url));

test('Cada uno de los nueve destinos tiene foto turística diferente y respaldo SVG local', () => {
  assert.equal(destinationPhotoIds.length, destinations.length);
  const photoSrcs = new Set();
  for (const destination of destinations) {
    const visual = destinationVisual(destination.id);
    assert.match(visual.src, /^https:\/\/images\.unsplash\.com\/photo-/);
    assert.match(visual.credit, /\S/);
    assert.ok(existsSync(resolve(base, 'public', visual.fallback.slice(1))));
    photoSrcs.add(visual.src);
  }
  assert.equal(photoSrcs.size, destinations.length);
});

test('Hoteles tienen imágenes referenciales distintas y ambas poseen fallback local', () => {
  const first = hotelVisual('kioto-hotel-1');
  const second = hotelVisual('kioto-hotel-2');
  assert.notEqual(first.src, second.src);
  for (const v of [first, second]) {
    assert.ok(v.src.startsWith('https://images.unsplash.com/'));
    assert.ok(existsSync(resolve(base, 'public', v.fallback.slice(1))));
  }
});

test('Fotos de inicio, catálogo y detalle se renderizan sin alterar los enlaces', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: DestinationCard } = await vite.ssrLoadModule('/src/components/DestinationCard.jsx');
    const { FavoritesProvider } = await vite.ssrLoadModule('/src/context/FavoritesContext.jsx');
    const card = renderToStaticMarkup(React.createElement(FavoritesProvider, null, React.createElement(MemoryRouter, null, React.createElement(DestinationCard, { destination: destinations[1] }))));
    assert.match(card, /images\.unsplash\.com/);
    assert.match(card, /href="\/destinos\/kioto"/);
    assert.match(card, /Vista turística referencial de Kioto/);
  } finally { await vite.close(); }
});

test('Voucher rediseñado conserva valores, muestra foto de destino y advertencia DEMO', async () => {
  const flight = flights.find((f) => f.destinationId === 'kioto' && f.available);
  const hotel = hotels.find((h) => h.destinationId === 'kioto' && h.available && h.checkIn === flight.departureDate);
  const booking = createDemoBooking({ destinationId: 'kioto', flightId: flight.id, hotelId: hotel.id,
    travelers: 2, rooms: 1, favorite: true, paymentMethod: 'demo-card',
    customer: { name: 'Cliente Demo', email: 'cliente@example.com' } });
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  try {
    const { default: Voucher } = await vite.ssrLoadModule('/src/pages/Voucher.jsx');
    const receipt = React.createElement(MemoryRouter, { initialEntries: [{ pathname: `/comprobante/${booking.bookingId}`, state: { receipt: booking } }] },
      React.createElement(Routes, null, React.createElement(Route, { path: '/comprobante/:id', element: React.createElement(Voucher) })));
    const html = renderToStaticMarkup(receipt);
    assert.match(html, /voucher-ticket/);
    assert.match(html, /images\.unsplash\.com/);
    assert.ok(html.includes(booking.bookingId));
    assert.match(html, /SIN VALIDEZ COMERCIAL/);
    assert.match(html, /Descargar voucher TXT/);
    assert.doesNotMatch(html, /cliente@example\.com/);
    assert.doesNotMatch(html, /Cliente Demo/);
  } finally { await vite.close(); }
});

test('El voucher sigue funcionando con solo alojamiento o solo vuelo', async () => {
  const flight = flights.find((f) => f.destinationId === 'kioto' && f.available);
  const hotel = hotels.find((h) => h.destinationId === 'kioto' && h.available);
  const { default: Voucher } = await (async () => {
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
    try { return { default: (await vite.ssrLoadModule('/src/pages/Voucher.jsx')).default }; }
    finally { await vite.close(); }
  })();
  for (const [flightId, hotelId, label] of [[flight.id, null, 'Solo vuelo'], [null, hotel.id, 'Solo alojamiento']]) {
    const booking = createDemoBooking({ destinationId: 'kioto', flightId, hotelId,
      travelers: 1, rooms: 1, favorite: false, paymentMethod: 'demo-transfer',
      customer: { name: 'Cliente Demo', email: 'cliente@example.com' } });
    const receipt = React.createElement(MemoryRouter, { initialEntries: [{ pathname: `/comprobante/${booking.bookingId}`, state: { receipt: booking } }] },
      React.createElement(Routes, null, React.createElement(Route, { path: '/comprobante/:id', element: React.createElement(Voucher) })));
    const html = renderToStaticMarkup(receipt);
    assert.ok(html.includes(label));
    assert.ok(html.includes(booking.bookingId));
  }
});
