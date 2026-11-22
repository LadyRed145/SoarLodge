/** Origen de la API mock. Vacío en local: Vite usa su proxy REST/GraphQL. */
export function apiUrl(path) {
  const origin = (import.meta.env?.VITE_API_ORIGIN || '').replace(/\/+$/, '');
  return `${origin}${path}`;
}
