import { apiUrl } from './api-origin.js';
import { validateDestinationPayload } from './destinations.js';

/** Cliente HTTP con gestión de errores, expiración de caché y peticiones compartidas. */
const cache = new Map();
const DEFAULT_TTL = 60_000;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function requestJSON(path, { fetchImpl = fetch, timeoutMs = 8_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(apiUrl(path), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 404) throw new ApiError('No encontramos los datos solicitados.', { status: 404, code: 'NOT_FOUND' });
      if (response.status >= 500) throw new ApiError('El servicio no está disponible temporalmente.', { status: response.status, code: 'SERVER_ERROR' });
      throw new ApiError('No pudimos completar la solicitud.', { status: response.status, code: 'HTTP_ERROR' });
    }
    const contentType = response.headers?.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new ApiError('La respuesta del servicio no es JSON.', { code: 'INVALID_RESPONSE' });
    }
    const body = await response.json();
    if (!body || typeof body !== 'object' || !validateDestinationPayload(path, body)) {
      throw new ApiError('La API devolvió datos incompletos o inválidos.', { code: 'INVALID_RESPONSE' });
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new ApiError('La solicitud demoró demasiado. Intenta nuevamente.', { code: 'TIMEOUT' });
    }
    if (error instanceof SyntaxError) {
      throw new ApiError('Los datos recibidos no tienen un formato válido.', { code: 'INVALID_JSON' });
    }
    throw new ApiError('No fue posible conectar con el servidor de destinos.', { code: 'NETWORK_ERROR' });
  } finally {
    clearTimeout(timeout);
  }
}

export function clearApiCache(path) {
  if (path === undefined) cache.clear();
  else cache.delete(path);
}

/** Evita solicitudes simultáneas duplicadas y reutiliza datos recientes durante 60 s. */
export function getResource(path, {
  force = false,
  ttlMs = DEFAULT_TTL,
  fetchImpl,
  timeoutMs,
} = {}) {
  if (force) cache.delete(path);
  const now = Date.now();
  const entry = cache.get(path);
  if (entry?.promise) return entry.promise;
  if (entry && entry.expiresAt > now) return Promise.resolve(entry.data);

  const pending = requestJSON(path, { fetchImpl, timeoutMs });
  cache.set(path, { promise: pending });
  pending.then(
    (data) => {
      if (cache.get(path)?.promise === pending) {
        cache.set(path, { data, expiresAt: Date.now() + ttlMs });
      }
    },
    () => {
      if (cache.get(path)?.promise === pending) cache.delete(path);
    },
  );
  return pending;
}

/** Cliente GraphQL separado del cliente REST; comparten convenciones de errores y caché. */
const graphqlCache = new Map();

export async function requestGraphQL(query, variables = {}, { fetchImpl = fetch, timeoutMs = 8_000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(apiUrl('/graphql'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ query, variables }),
    });
    const contentType = response.headers?.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new ApiError('La respuesta GraphQL no contiene JSON.', { code: 'INVALID_RESPONSE' });
    }
    const payload = await response.json();
    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      throw new ApiError(payload.errors[0]?.message || 'La consulta GraphQL devolvió un error.', { status: response.status, code: 'GRAPHQL_ERROR' });
    }
    if (!response.ok) {
      throw new ApiError(response.status >= 500 ? 'El servidor GraphQL no está disponible.' : 'La consulta GraphQL falló.', { status: response.status, code: 'HTTP_ERROR' });
    }
    if (!payload || typeof payload.data !== 'object' || !payload.data || Array.isArray(payload.data)) {
      throw new ApiError('La respuesta GraphQL no incluye datos válidos.', { code: 'INVALID_RESPONSE' });
    }
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') throw new ApiError('La consulta GraphQL demoró demasiado. Intenta nuevamente.', { code: 'TIMEOUT' });
    if (error instanceof SyntaxError) throw new ApiError('La respuesta GraphQL no es JSON válido.', { code: 'INVALID_JSON' });
    throw new ApiError('No se pudo conectar con el servidor GraphQL de vuelos y hoteles.', { code: 'NETWORK_ERROR' });
  } finally { clearTimeout(timeout); }
}

export function clearGraphQLCache() { graphqlCache.clear(); }

/** Una consulta para vuelos y hoteles; deduplicación por query + variables y TTL de 60 segundos. */
export function getGraphQLResource(query, variables = {}, { force = false, ttlMs = DEFAULT_TTL, fetchImpl, timeoutMs } = {}) {
  const cacheKey = JSON.stringify([query, variables]);
  if (force) graphqlCache.delete(cacheKey);
  const entry = graphqlCache.get(cacheKey);
  if (entry?.promise) return entry.promise;
  if (entry && entry.expiresAt > Date.now()) return Promise.resolve(entry.data);
  const pending = requestGraphQL(query, variables, { fetchImpl, timeoutMs });
  graphqlCache.set(cacheKey, { promise: pending });
  pending.then(
    (data) => { if (graphqlCache.get(cacheKey)?.promise === pending) graphqlCache.set(cacheKey, { data, expiresAt: Date.now() + ttlMs }); },
    () => { if (graphqlCache.get(cacheKey)?.promise === pending) graphqlCache.delete(cacheKey); },
  );
  return pending;
}
