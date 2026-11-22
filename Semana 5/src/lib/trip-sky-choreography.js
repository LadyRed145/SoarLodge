/**
 * Coreografía de Mi viaje: el avión se ASOMA y VUELVE a esconderse bajo la
 * misma nube. Entre juegos realiza las tres rutas aprobadas del Inicio.
 * Los trayectos son puros/deterministas y se pueden probar sin navegador.
 */
import { positionOnRoute } from './flight-routes.js';

export const TRIP_SKY_SEGMENTS = Object.freeze([
  { kind: 'peek', cloud: 'mint', duration: 8000 },
  { kind: 'pause', duration: 1700 },
  { kind: 'peek', cloud: 'peach', duration: 8500 },
  { kind: 'pause', duration: 1600 },
  { kind: 'flight', route: 'horizontal', duration: 7000 },
  { kind: 'pause', duration: 2000 },
  { kind: 'peek', cloud: 'mint', duration: 8000 },
  { kind: 'pause', duration: 1600 },
  { kind: 'flight', route: 'vertical', duration: 7000 },
  { kind: 'pause', duration: 2100 },
  { kind: 'peek', cloud: 'peach', duration: 8500 },
  { kind: 'pause', duration: 1900 },
  { kind: 'flight', route: 'diagonal', duration: 7800 },
  { kind: 'pause', duration: 2400 },
].map((segment) => Object.freeze(segment)));

export const TRIP_SKY_CYCLE_MS = TRIP_SKY_SEGMENTS.reduce((sum, entry) => sum + entry.duration, 0);

const clamp = (value) => Math.min(1, Math.max(0, value));
const ease = (t) => { const x = clamp(t); return x * x * (3 - 2 * x); };

/** Abre camino, se queda curioseando y vuelve EXACTAMENTE al escondite. */
export function peekDistance(progress) {
  const t = clamp(progress);
  if (t <= 0.09 || t >= 0.94) return 0;
  if (t < 0.38) return ease((t - 0.09) / 0.29);
  if (t <= 0.63) return 1;
  return 1 - ease((t - 0.63) / 0.31);
}

export function peekPosition(cloud, progress, rawWidth, rawHeight) {
  const width = Math.max(1, Number(rawWidth) || 1);
  const height = Math.max(1, Number(rawHeight) || 1);
  const reach = Math.min(198, width * 0.36);
  const amount = peekDistance(progress);
  const wiggle = Math.sin(Math.PI * clamp(progress)) * 6;
  if (cloud === 'mint') {
    // Origen: en el centro de la nube menta del primer plano, que lo tapa.
    return {
      x: width * -0.016 + Math.min(98, width * 0.16) + reach * amount,
      y: height * 0.17 + 56 - wiggle,
      angle: -3 - amount * 8,
    };
  }
  if (cloud === 'peach') {
    // Reaparece por la izquierda de la nube durazno y vuelve bajo ella.
    return {
      x: width * 0.93 - Math.min(108, width * 0.18) - reach * amount,
      y: height * 0.28 + 54 - wiggle,
      angle: 180 + amount * 7,
    };
  }
  throw new RangeError(`Nube de escondite desconocida: ${cloud}`);
}

/** Un solo avión visible a la vez; en las pausas regresa a las nubes. */
export function tripSkyAt(elapsedMs, width, height) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0) % TRIP_SKY_CYCLE_MS;
  let cursor = 0;
  for (const segment of TRIP_SKY_SEGMENTS) {
    if (elapsed < cursor + segment.duration) {
      if (segment.kind === 'pause') return null;
      const progress = (elapsed - cursor) / segment.duration;
      if (segment.kind === 'flight') {
        return { kind: 'flight', route: segment.route, progress, ...positionOnRoute(segment.route, progress, width, height) };
      }
      return { kind: 'peek', cloud: segment.cloud, progress, ...peekPosition(segment.cloud, progress, width, height) };
    }
    cursor += segment.duration;
  }
  return null;
}
