import { Link } from 'react-router';
import FavoriteButton from './FavoriteButton.jsx';
import Photo from './Photo.jsx';
import { destinationVisual } from '../lib/visuals.js';
export default function DestinationCard({ destination, index = 0, interest = null }) {
  const visual = destinationVisual(destination.id);
  const detail = `/destinos/${destination.id}`;
  const destinationLink = interest === 'vuelos' ? `${detail}#vuelos` : interest === 'hoteles' ? `${detail}#hoteles` : detail;
  const actionLabel = interest === 'vuelos' ? 'Ver vuelos' : interest === 'hoteles' ? 'Ver hoteles' : 'Vuelos + hoteles';
  return <article className={`destination-card destination-tone-${index % 4}`}>
    <div className="destination-cover"><Link to={destinationLink} aria-label={`Explorar ${destination.name}, ${destination.country}`}><Photo src={visual.src} fallback={visual.fallback} alt={`Vista turística referencial de ${destination.name}, ${destination.country}`} loading={index < 3 ? 'eager' : 'lazy'}/></Link>
      <span className="image-tag">{destination.label}</span><FavoriteButton id={destination.id} name={destination.name}/>
    </div>
    <div className="destination-body"><span className="destination-country">📍 {destination.country} · {destination.location}</span><h3><Link to={destinationLink}>{destination.name}</Link></h3><p>{destination.subtitle}</p><div className="card-bottom"><span>{destination.activities.length} experiencias</span><Link to={destinationLink}>{actionLabel} <span aria-hidden="true">↗</span></Link></div></div>
  </article>;
}
