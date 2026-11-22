import { destinations, regions } from './data.mjs';
import { executeGraphQL, GraphQLQueryError } from './graphql-engine.mjs';
import { BookingError, createDemoBooking, readBookingJSON } from './bookings.mjs';

const json = (res, status, body) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(body));
};

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

/** REST + endpoint GraphQL mock en un mismo servidor HTTP. */
async function graphQLHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    json(res, 405, { errors: [{ message: 'GraphQL requiere una solicitud POST.' }] });
    return;
  }
  if (!String(req.headers['content-type'] ?? '').toLowerCase().includes('application/json')) {
    json(res, 415, { errors: [{ message: 'GraphQL requiere Content-Type: application/json.' }] });
    return;
  }
  try {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk.toString('utf8');
      if (raw.length > 20_000) {
        json(res, 413, { errors: [{ message: 'El cuerpo excede el límite de 20 KB.' }] });
        return;
      }
    }
    let body;
    try { body = JSON.parse(raw); }
    catch { json(res, 400, { errors: [{ message: 'El cuerpo JSON es inválido.' }] }); return; }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      json(res, 400, { errors: [{ message: 'Se esperaba un objeto JSON.' }] });
      return;
    }
    json(res, 200, { data: executeGraphQL(body.query, body.variables) });
  } catch (error) {
    if (error instanceof GraphQLQueryError) {
      json(res, 400, { errors: [{ message: error.message }] });
      return;
    }
    console.error('[GraphQL mock]', error);
    json(res, 500, { errors: [{ message: 'No fue posible completar la consulta GraphQL.' }] });
  }
}

export function createHandler({ delayMs = 240 } = {}) {
  return async (req, res) => {
    let url;
    try { url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`); }
    catch { json(res, 400, { error: 'URL inválida.', code: 'BAD_REQUEST' }); return; }

    if (url.pathname === '/api/bookings') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); json(res, 405, { error: 'Usa POST para la simulación.', code: 'METHOD_NOT_ALLOWED' }); return; }
      try { const payload = await readBookingJSON(req); json(res, 201, createDemoBooking(payload)); }
      catch (error) {
        if (error instanceof BookingError) json(res, error.status, { error: error.message, code: error.code });
        else { console.error('[Booking mock]', error); json(res, 500, { error: 'Error de simulación.', code: 'SERVER_ERROR' }); }
      }
      return;
    }
    if (url.pathname === '/graphql') {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (url.searchParams.get('simulate') === '500') {
        json(res, 500, { errors: [{ message: 'Error GraphQL simulado.' }] });
        return;
      }
      await graphQLHandler(req, res);
      return;
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      json(res, 405, { error: 'El catálogo turístico solo admite GET.', code: 'METHOD_NOT_ALLOWED' });
      return;
    }

    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Permite probar visualmente los errores HTTP desde la interfaz.
    const simulated = url.searchParams.get('simulate');
    if (simulated === '500' || simulated === '404') {
      const status = Number(simulated);
      json(res, status, { error: 'Error HTTP simulado.', code: 'SIMULATED_ERROR' });
      return;
    }

    if (url.pathname === '/api/health') {
      json(res, 200, { status: 'ok', service: 'Soarlodge REST mock', version: 'semana-5' });
      return;
    }
    if (url.pathname === '/api/regions') {
      json(res, 200, { regions, total: regions.length });
      return;
    }
    if (url.pathname === '/api/destinations') {
      const region = url.searchParams.get('region');
      const q = normalize((url.searchParams.get('q') ?? '').trim());
      if (region && !regions.some((item) => item.id === region)) {
        json(res, 400, { error: 'La región no es válida.', code: 'INVALID_REGION' });
        return;
      }
      const selected = destinations.filter((destination) => (
        (!region || destination.region === region) &&
        (!q || normalize(`${destination.name} ${destination.country} ${destination.location} ${destination.activities.join(' ')}`).includes(q))
      ));
      json(res, 200, { destinations: selected, total: selected.length });
      return;
    }
    if (/^\/api\/destinations\/[^/]+$/.test(url.pathname)) {
      let id;
      try { id = decodeURIComponent(url.pathname.slice('/api/destinations/'.length)); }
      catch { json(res, 400, { error: 'Identificador inválido.', code: 'BAD_REQUEST' }); return; }
      const destination = destinations.find((item) => item.id === id);
      if (!destination) {
        json(res, 404, { error: 'El destino solicitado no existe.', code: 'DESTINATION_NOT_FOUND' });
        return;
      }
      json(res, 200, { destination });
      return;
    }
    json(res, 404, { error: 'Ruta REST no encontrada.', code: 'NOT_FOUND' });
  };
}
