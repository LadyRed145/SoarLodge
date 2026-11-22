import { Link } from 'react-router';
import { useApiResource } from '../hooks/useApiResource.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import BrandMark from '../components/BrandMark.jsx';
import { ErrorPanel, LoadingGrid } from '../components/ResourceStatus.jsx';
export default function Favorites() {
  const { favorites } = useFavorites();
  const resource = useApiResource('/api/destinations');
  const items = (resource.data?.destinations ?? []).filter((d) => favorites.includes(d.id));
  return <div className="layout-width favorites-page page-pad">
    <div className="page-heading split-title"><div><span className="tagline">♡ TU RINCÓN FAVORITO</span><h1>Los lugares que te <em>hacen ojitos.</em></h1><p>Guarda tus destinos favoritos para encontrarlos al instante. Si reservas un pack de demostración en uno de ellos, obtienes un 3% extra de descuento ficticio.</p></div><div className="favorites-decoration favorites-decoration--stamp" aria-hidden="true"><BrandMark className="favorites-brand-mark"/><span>♡</span></div></div>
    <div className="promo-ribbon promo-ribbon--sunlit"><span className="promo-emoji" aria-hidden="true">🎁</span><div><strong>Tu lista tiene premio</strong><p>Pack vuelo + hotel: 8% de descuento demo. Si el destino está en favoritos: +3% adicional sobre el subtotal.</p></div></div>
    {resource.status === 'loading' && <LoadingGrid message="Buscando tus rincones favoritos…" count={3}/>}
    {resource.status === 'error' && <ErrorPanel error={resource.error} onRetry={resource.retry}/>}
    {resource.status === 'success' && (items.length ? <div className="destination-grid">{items.map((d,i)=><DestinationCard key={d.id} destination={d} index={i}/>)}</div> : <div className="friendly-empty"><span aria-hidden="true">🌴</span><h2>Todavía no tienes favoritos</h2><p>Guarda un destino usando el corazón de cada tarjeta. La aventura comienza con un flechazo.</p><Link className="btn btn-primary" to="/destinos">Descubrir destinos ↗</Link></div>)}
  </div>;
}
