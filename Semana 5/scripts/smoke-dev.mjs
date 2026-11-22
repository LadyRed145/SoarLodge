/** Verifica el enlace entre Vite (frontend) y REST/GraphQL/checkout (backend).
 * Usa puertos efímeros, sin navegador, red externa ni servicios de pago.
 */
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { createHandler } from '../server/handler.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const api = createHttpServer(createHandler({ delayMs: 0 }));
let vite;

try {
  api.listen(0, '127.0.0.1');
  await once(api, 'listening');
  const target = `http://127.0.0.1:${api.address().port}`;
  vite = await createViteServer({
    root,
    configFile: resolve(root, 'vite.config.js'),
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: [], entries: [] },
    server: {
      host: '127.0.0.1', port: 0, strictPort: false,
      proxy: { '/api': { target, changeOrigin: true }, '/graphql': { target, changeOrigin: true } },
    },
  });
  await vite.listen();
  const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /soarlodge/i);
  const clientRoute = await fetch(`${origin}/destinos/kioto`);
  assert.equal(clientRoute.status, 200);
  console.log('✓ Vite entrega portada y soporta rutas React Router en desarrollo');

  const health = await fetch(`${origin}/api/health`);
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, 'ok');
  console.log('✓ Proxy Vite → REST responde');

  const gql = await fetch(`${origin}/graphql`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '{ hotels(destinationId:"bali") { id name } }' }),
  });
  assert.equal(gql.status, 200);
  assert.equal((await gql.json()).data.hotels.length, 6);
  console.log('✓ Proxy Vite → GraphQL responde');

  const invalidBooking = await fetch(`${origin}/api/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destinationId: 'kioto' }),
  });
  assert.equal(invalidBooking.status, 400);
  assert.equal((await invalidBooking.json()).code, 'INVALID_CUSTOMER');
  console.log('✓ Proxy Vite → Checkout conserva errores controlados');
  console.log('\n✈ Soarlodge: smoke de frontend + backend local aprobado.');
} catch (error) {
  console.error('✖ Falló smoke:dev:', error);
  process.exitCode = 1;
} finally {
  if (vite) await vite.close();
  await new Promise((resolve) => api.close(() => resolve()));
}
