/** Funciones puras de la capa de presentación: filtros sin peticiones adicionales. */
export const normalizeText = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export function filterDestinations(destinations, { search = '', region = 'all' } = {}) {
  if (!Array.isArray(destinations)) return [];
  const q = normalizeText(search);
  return destinations.filter((item) => {
    const matchesRegion = region === 'all' || item.region === region;
    const matchesSearch = !q || normalizeText(`${item.name} ${item.country} ${item.location} ${item.activities?.join(' ') ?? ''}`).includes(q);
    return matchesRegion && matchesSearch;
  });
}

/**
 * Punto de llegada de la búsqueda de Inicio.
 * - Destino único (incluido un país con un único destino): abre su ficha.
 * - Región: aplica su filtro en el catálogo.
 * - Varios resultados / búsqueda libre: abre resultados, nunca la portada de la noria.
 * No depende de la API desde esta función; se prueban rutas sin renderizar React.
 */
export function destinationSearchPath(query, destinations = [], regions = []) {
  const term = String(query ?? '').trim();
  if (!term) return '/destinos#resultados';
  const normalized = normalizeText(term);
  const region = regions.find((item) => normalizeText(item.name) === normalized || normalizeText(item.id) === normalized);
  if (region) return `/destinos?region=${encodeURIComponent(region.id)}#resultados`;

  const matches = filterDestinations(destinations, { search: term });
  const exactName = matches.find((item) => normalizeText(item.name) === normalized);
  const singleDestination = exactName ?? (matches.length === 1 ? matches[0] : null);
  if (singleDestination) return `/destinos/${encodeURIComponent(singleDestination.id)}`;

  return `/destinos?q=${encodeURIComponent(term)}#resultados`;
}

export function sortDestinations(destinations, order = 'name') {
  const copied = [...destinations];
  if (order === 'country') return copied.sort((a, b) => a.country.localeCompare(b.country, 'es') || a.name.localeCompare(b.name, 'es'));
  if (order === 'region') return copied.sort((a, b) => a.region.localeCompare(b.region, 'es') || a.name.localeCompare(b.name, 'es'));
  return copied.sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Agrupa una lista YA ordenada por región, sin alterar el orden de las tarjetas.
 * Los encabezados reflejan exactamente los destinos que sobreviven a los filtros.
 */
export function groupDestinationsByRegion(sortedDestinations) {
  if (!Array.isArray(sortedDestinations)) return [];
  return sortedDestinations.reduce((groups, destination) => {
    const previous = groups.at(-1);
    if (previous?.id === destination.region) previous.destinations.push(destination);
    else groups.push({ id: destination.region, destinations: [destination] });
    return groups;
  }, []);
}

const isDestination = (item) => item && typeof item === 'object' &&
  typeof item.id === 'string' && typeof item.name === 'string' &&
  typeof item.country === 'string' && typeof item.region === 'string' &&
  typeof item.description === 'string' && Array.isArray(item.activities) && item.activities.every((activity) => typeof activity === 'string');

export function validateDestinationPayload(path, payload) {
  if (path === '/api/destinations' || path.startsWith('/api/destinations?')) {
    return Boolean(payload && Array.isArray(payload.destinations) &&
      Number.isInteger(payload.total) && payload.total === payload.destinations.length && payload.destinations.every(isDestination));
  }
  if (path.startsWith('/api/destinations/')) return isDestination(payload?.destination);
  if (path === '/api/regions') return Boolean(payload && Array.isArray(payload.regions) && payload.regions.every((item) => typeof item.id === 'string' && typeof item.name === 'string'));
  return true;
}
