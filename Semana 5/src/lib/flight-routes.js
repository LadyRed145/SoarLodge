/**
 * Trayectos decorativos del avión en el hero de Soarlodge.
 * Tres pasadas independientes separadas por escalas fuera de pantalla.
 * La orientación sale de la tangente de cada curva, no de un ángulo fijo.
 */
export const FLIGHT_ROUTES = Object.freeze([
  Object.freeze({ id: 'horizontal', duration: 7400, stopover: 1300 }),
  Object.freeze({ id: 'vertical', duration: 6900, stopover: 1400 }),
  Object.freeze({ id: 'diagonal', duration: 7900, stopover: 1600 }),
]);

export const FLIGHT_CYCLE_MS = FLIGHT_ROUTES.reduce(
  (total, route) => total + route.duration + route.stopover, 0,
);

const point = (x, y) => ({ x, y });
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

function bezier(t, a, b, c, d) {
  const inv = 1 - t;
  return inv ** 3 * a + 3 * inv ** 2 * t * b + 3 * inv * t ** 2 * c + t ** 3 * d;
}

function bezierDerivative(t, a, b, c, d) {
  const inv = 1 - t;
  return 3 * inv ** 2 * (b - a) + 6 * inv * t * (c - b) + 3 * t ** 2 * (d - c);
}

/** Los extremos salen totalmente del hero, incluso en móvil. */
export function routeControlPoints(routeId, rawWidth, rawHeight) {
  const width = Math.max(1, Number(rawWidth) || 1);
  const height = Math.max(1, Number(rawHeight) || 1);
  const margin = 94;

  if (routeId === 'horizontal') {
    return [
      point(-margin, height * 0.24),
      point(width * 0.24, height * 0.15),
      point(width * 0.70, height * 0.24),
      point(width + margin, height * 0.17),
    ];
  }
  if (routeId === 'vertical') {
    return [
      point(width * 0.83, height + margin),
      point(width * 0.81, height * 0.64),
      point(width * 0.70, height * 0.28),
      point(width * 0.64, -margin),
    ];
  }
  if (routeId === 'diagonal') {
    return [
      point(-margin, height * 0.76),
      point(width * 0.19, height * 0.58),
      point(width * 0.69, height * 0.30),
      point(width + margin, -margin),
    ];
  }
  throw new RangeError(`Ruta aérea desconocida: ${routeId}`);
}

export function positionOnRoute(routeId, progress, width, height) {
  const t = clamp(Number(progress) || 0, 0, 1);
  const [a, b, c, d] = routeControlPoints(routeId, width, height);
  const x = bezier(t, a.x, b.x, c.x, d.x);
  const y = bezier(t, a.y, b.y, c.y, d.y);
  const dx = bezierDerivative(t, a.x, b.x, c.x, d.x);
  const dy = bezierDerivative(t, a.y, b.y, c.y, d.y);
  return { x, y, angle: Math.atan2(dy, dx) * (180 / Math.PI) };
}

/**
 * Retorna null durante las escalas. Nunca salta de una ruta a la siguiente
 * en medio de la pantalla: cada tramo empieza y termina fuera del hero.
 */
export function flightAt(elapsedMs, width, height) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0);
  const time = elapsed % FLIGHT_CYCLE_MS;
  const cycle = Math.floor(elapsed / FLIGHT_CYCLE_MS);
  let cursor = 0;
  for (const [index, route] of FLIGHT_ROUTES.entries()) {
    if (time < cursor + route.duration) {
      const progress = (time - cursor) / route.duration;
      // Alternamos en CADA pasada, incluso entre el final de un ciclo y el siguiente.
      // Así no se repite eternamente una misma ruta delante o detrás de las postales.
      const depth = (cycle * FLIGHT_ROUTES.length + index) % 2 === 0 ? 'behind' : 'front';
      return { route: route.id, progress, depth, ...positionOnRoute(route.id, progress, width, height) };
    }
    cursor += route.duration;
    if (time < cursor + route.stopover) return null;
    cursor += route.stopover;
  }
  return null;
}
