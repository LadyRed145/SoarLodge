export const FAVORITES_KEY = 'soarlodge:favorites:v1';
const VALID_ID = /^[a-z0-9-]{1,70}$/;
/** No se guardan datos personales: solo los identificadores del catálogo. */
export function normalizeFavorites(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) => typeof id === 'string' && VALID_ID.test(id)))].slice(0, 30);
}
export function toggleFavorite(list, id) {
  if (typeof id !== 'string' || !VALID_ID.test(id)) return normalizeFavorites(list);
  const safe = normalizeFavorites(list);
  return safe.includes(id) ? safe.filter((item) => item !== id) : normalizeFavorites([...safe, id]);
}
