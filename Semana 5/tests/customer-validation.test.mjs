import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from '../server/handler.mjs';
import { cleanTravelerNameInput, validTravelerName, validTravelerEmail } from '../src/lib/customer-validation.js';
import { createDemoBooking, BookingError } from '../server/bookings.mjs';
import { flights, hotels } from '../server/travel-data.mjs';

const flight = flights.find(item => item.destinationId === 'kioto' && item.available);
const hotel = hotels.find(item => item.destinationId === 'kioto' && item.available && item.checkIn === flight.departureDate);
const sample = () => ({ destinationId: 'kioto', flightId: flight.id, hotelId: hotel.id,
  travelers: 1, rooms: 1, favorite: false, paymentMethod: 'demo-card',
  customer: { name: 'María José Núñez', email: 'maria.jose+viaje@sub.dominio.cl' } });

test('Nombre completo: permite letras Unicode, ñ y espacios; rechaza dígitos y signos', () => {
  for (const name of ['Ana', 'María José', 'Ñuñoa', 'Élodie Lefèvre', '李 小龍']) {
    assert.equal(validTravelerName(name), true, name);
  }
  for (const name of ['A', '', 'Ana123', 'Pedro?', 'Ana-Díaz', 'M@ria', 'Ana   Pérez', ' Ana\nDíaz ', 'Ana\n', 'Ana\t', '12345']) {
    assert.equal(validTravelerName(name), false, name);
  }
  assert.equal(cleanTravelerNameInput('María  José123!'), 'María José');
  assert.equal(cleanTravelerNameInput('  Ángeles#2 García'), 'Ángeles García');
});

test('Correo: acepta correos habituales y rechaza dominios incompletos y formatos dañados', () => {
  for (const email of ['ana@example.com', 'maria.jose+viajes@correo.com.ar', 'n.t-1@ejemplo.cl', 'a@b.org', 'abc_123@sub.dominio.net']) {
    assert.equal(validTravelerEmail(email), true, email);
  }
  for (const email of ['', 'sin-arroba.com', 'ana@', '@dominio.cl', 'ana@@dominio.cl', 'ana@dominio',
    'ana@dominio.c', 'ana..diaz@dominio.cl', '.ana@dominio.cl', 'ana.@dominio.cl',
    'ana@-dominio.cl', 'ana@dominio-.cl', 'ana@dominio..cl', 'ana@dominio.c_l',
    'ana nombre@dominio.cl', 'ana@dominio.cl ', 'ana@dominio.cl<script>']) {
    assert.equal(validTravelerEmail(email), false, email);
  }
});

test('Servidor aplica ambas validaciones, incluso si se envía POST sin pasar por el formulario', () => {
  assert.equal(createDemoBooking(sample()).mode, 'DEMO');
  for (const name of ['Ana23', 'Juan?', 'M4ría', 'a']) {
    assert.throws(() => createDemoBooking({ ...sample(), customer: { ...sample().customer, name } }),
      error => error instanceof BookingError && error.code === 'INVALID_CUSTOMER');
  }
  for (const email of ['a@b.c', 'ana@-dominio.com', 'a..b@dominio.cl']) {
    assert.throws(() => createDemoBooking({ ...sample(), customer: { ...sample().customer, email } }),
      error => error instanceof BookingError && error.code === 'INVALID_CUSTOMER');
  }
});

test('Formulario filtra nombres, valida el correo y muestra mensajes accesibles', () => {
  const checkout = readFileSync(new URL('../src/pages/Checkout.jsx', import.meta.url), 'utf8');
  assert.match(checkout, /cleanTravelerNameInput\(e\.target\.value\)/);
  assert.match(checkout, /validTravelerEmail\(customer\.email\.trim\(\)\)/);
  assert.match(checkout, /checkout-name-error/);
  assert.match(checkout, /checkout-email-error/);
  assert.match(checkout, /aria-invalid/);
});


test('POST /api/bookings devuelve 400 para nombre o correo inválidos sin crear voucher', async () => {
  const server = createServer(createHandler({ delayMs: 0 }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const customer of [
      { name: 'Ana123', email: 'ana@example.cl' },
      { name: 'Ana Pérez', email: 'ana@dominio..cl' },
    ]) {
      const response = await fetch(`${base}/api/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sample(), customer }),
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 'INVALID_CUSTOMER');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
