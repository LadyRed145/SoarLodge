/** Resuelve recursos públicos de Vite sin romper el prefijo del repositorio en Pages. */
export function assetPath(path) {
  const base = import.meta.env?.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\/+/, '')}`;
}
