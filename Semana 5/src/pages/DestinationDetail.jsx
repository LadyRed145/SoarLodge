import { Link, useParams } from 'react-router';
import { useApiResource } from '../hooks/useApiResource.js';
import { ErrorPanel, LoadingGrid } from '../components/ResourceStatus.jsx';
import TravelOptions from '../components/TravelOptions.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';
import Photo from '../components/Photo.jsx';
import BrandMark from '../components/BrandMark.jsx';
import { destinationVisual } from '../lib/visuals.js';

export default function DestinationDetail() {
  const { id } = useParams();
  const resource = useApiResource(`/api/destinations/${encodeURIComponent(id ?? '')}`);
  const destination = resource.data?.destination;

  return <div className="layout-width detail-page">
    <nav className="breadcrumb" aria-label="Ruta de navegación"><Link to="/">Inicio</Link><span aria-hidden="true">/</span><Link to="/destinos">Destinos</Link><span aria-hidden="true">/</span><span aria-current="page">{destination?.name ?? 'Detalle'}</span></nav>
    {resource.status === 'loading' && <LoadingGrid message="Preparando los detalles del destino…" count={1}/>}
    {resource.status === 'error' && <ErrorPanel error={resource.error} onRetry={resource.retry}/>}
    {resource.status === 'success' && destination && <>
      <div className="detail-heading"><div><p className="eyebrow">{destination.country} · {destination.location}</p><h1>{destination.name}<span aria-hidden="true">.</span></h1><p>{destination.subtitle}</p><div className="detail-top-actions"><FavoriteButton id={destination.id} name={destination.name}/><span>Guarda el destino y desbloquea un 3% extra en tu pack demo ♡</span></div></div><Link className="text-back" to="/destinos">← Todos los destinos</Link></div>
      <div className="detail-hero detail-hero--photo">
        <Photo {...destinationVisual(destination.id)} alt={`Vista panorámica referencial de ${destination.name}, ${destination.country}`} loading="eager"/>
        <span>{destination.label}</span>
        <div className="detail-photo-bottom"><strong>✦ Postales de {destination.name}</strong><small>Foto referencial · Unsplash / {destinationVisual(destination.id).credit}</small></div>
      </div>
      <div className="detail-columns"><article className="detail-article"><p className="eyebrow">UN POQUITO DE ESTE LUGAR</p><h2>¿Qué tiene de <em>especial?</em></h2><p>{destination.description}</p><h3>Experiencias que puedes descubrir</h3><ul className="activity-list">{destination.activities.map((activity) => <li key={activity}><span aria-hidden="true">✦</span>{activity}</li>)}</ul></article>
      <aside className="detail-aside detail-aside--postcard" aria-label="Información del destino"><BrandMark className="detail-guide-stamp"/><p className="eyebrow">GUÍA RÁPIDA</p><div><span>País</span><strong>{destination.country}</strong></div><div><span>Región</span><strong>{destination.region === 'america' ? 'América' : destination.region === 'asia' ? 'Asia' : destination.region === 'europa' ? 'Europa' : destination.region === 'africa' ? 'África' : 'Oceanía'}</strong></div><div><span>Mejor temporada orientativa</span><strong>{destination.bestSeason}</strong></div><div><span>Clima general</span><strong>{destination.climate}</strong></div><p className="aside-note">Información referencial. Las condiciones y temporadas pueden variar.</p></aside></div>
      <TravelOptions key={destination.id} destinationId={destination.id} destinationName={destination.name}/>
    </>}
  </div>;
}
