/**
 * Motivos ornamentales de cada destino (exclusivamente visuales).
 * No son imágenes reales ni información turística adicional.
 * La lista es intencionalmente pequeña para no competir con las fotografías.
 */
export const DESTINATION_MOTIFS = Object.freeze({
  bali: Object.freeze(['🌴', '🌺', '🛕']),
  banff: Object.freeze(['🏔️', '🌲', '🦌']),
  kioto: Object.freeze(['⛩️', '🌸', '🍵']),
  lisboa: Object.freeze(['🚋', '🌊', '🏛️']),
  marrakech: Object.freeze(['🕌', '🏺', '✨']),
  reikiavik: Object.freeze(['❄️', '♨️', '🌌']),
  sydney: Object.freeze(['🐨', '🌊', '🏄']),
  'torres-del-paine': Object.freeze(['🏔️', '🥾', '🦙']),
  tofino: Object.freeze(['🌲', '🌊', '🛶']),
});

/** Devuelve motivos solo para una ruta de detalle conocida. */
export function motifsForPath(pathname = '') {
  const match = /^\/destinos\/([^/?#]+)\/?$/.exec(pathname);
  if (!match) return null;
  let id;
  try { id = decodeURIComponent(match[1]); } catch { return null; }
  return Object.hasOwn(DESTINATION_MOTIFS, id) ? DESTINATION_MOTIFS[id] : null;
}
