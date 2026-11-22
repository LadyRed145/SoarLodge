import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FAVORITES_KEY, normalizeFavorites, toggleFavorite } from '../lib/favorites.js';
const FavoritesContext = createContext(null);
function initial() {
  try { return normalizeFavorites(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]')); }
  catch { return []; }
}
export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(initial);
  useEffect(() => {
    try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); } catch { /* opción privada */ }
  }, [favorites]);
  const value = useMemo(() => ({ favorites, isFavorite: (id) => favorites.includes(id),
    toggle: (id) => setFavorites((previous) => toggleFavorite(previous, id)) }), [favorites]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('Se necesita FavoritesProvider.');
  return value;
}
