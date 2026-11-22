import { useFavorites } from '../context/FavoritesContext.jsx';
export default function FavoriteButton({ id, name, className = '' }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(id);
  return <button type="button" className={`favorite-button ${active ? 'is-favorite' : ''} ${className}`}
    aria-label={`${active ? 'Quitar' : 'Guardar'} ${name} ${active ? 'de' : 'en'} favoritos`}
    aria-pressed={active} title={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    onClick={() => toggle(id)}><span aria-hidden="true">{active ? '♥' : '♡'}</span></button>;
}
