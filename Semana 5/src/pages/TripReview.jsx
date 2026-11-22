import { Link } from 'react-router';
import { usePlannerStore } from '../context/TripPlannerContext.jsx';
import { useApiResource } from '../hooks/useApiResource.js';
import { useTravelOptions } from '../hooks/useTravelOptions.js';
import { useTripSelection } from '../hooks/useTripSelection.js';
import { ErrorPanel } from '../components/ResourceStatus.jsx';
import { TripSummary } from '../components/TravelOptions.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { readVoucher, VOUCHER_KEY } from '../lib/booking.js';
import BrandMark from '../components/BrandMark.jsx';

const EMPTY = Object.freeze([]);
function SavedTrip({ destinationId }) {
  const destination = useApiResource(`/api/destinations/${encodeURIComponent(destinationId)}`);
  const resource = useTravelOptions(destinationId);
  const trip = useTripSelection(destinationId, resource.data?.flights ?? EMPTY, resource.data?.hotels ?? EMPTY);
  const { isFavorite } = useFavorites();
  if (destination.status === 'error') return <ErrorPanel error={destination.error} onRetry={destination.retry}/>;
  if (resource.status === 'error') return <ErrorPanel error={resource.error} onRetry={resource.retry}/>;
  if (destination.status !== 'success' || resource.status !== 'success') return <p className="options-loading" role="status">Preparando tu itinerario guardado…</p>;
  return <>
    <TripSummary favorite={isFavorite(destinationId)} destinationName={`en ${destination.data.destination.name}`} summary={trip.summary} notice={trip.selection.notice} onClear={trip.clear}/>
    <div className="review-actions"><Link className="btn btn-primary" to={`/destinos/${destinationId}#opciones`}>Editar vuelos y alojamientos ↗</Link><Link className="btn btn-quiet" to="/destinos">Explorar otros destinos</Link></div>
    <p className="options-disclaimer">Precios y promociones ficticios. La confirmación en el checkout solo emite un voucher de demostración.</p>
  </>;
}
export default function TripReview() {
  const { stored } = usePlannerStore();
  let lastVoucher = null;
  try { lastVoucher = readVoucher(window.localStorage.getItem(VOUCHER_KEY)); } catch { /* almacenamiento deshabilitado */ }
  return <div className="layout-width trip-review-page">
    <header className="trip-review-intro"><p className="eyebrow">🧳 TU AVENTURA EN CONSTRUCCIÓN</p><h1>El viaje que <em>estás soñando.</em></h1>
    <p className="trip-review-lead">Consulta el viaje que has ido preparando, incluso si cambiaste de página.</p></header><div className="trip-route-banner" aria-label="Tu ruta de planificación"><BrandMark className="trip-route-mark"/><div><strong>Tu historia comienza aquí</strong><span>Destino <b aria-hidden="true">· · · ✈ · · ·</b> Vuelo y alojamiento <b aria-hidden="true">· · ·</b> Voucher demo</span></div></div>
    {lastVoucher && <div className="previous-voucher"><span>🎟 Último viaje de demostración confirmado</span><Link className="btn btn-outline" to={`/comprobante/${lastVoucher.bookingId}`}>Ver último voucher ↗</Link></div>}
    {stored.destinationId ? <SavedTrip destinationId={stored.destinationId}/> : <div className="review-empty"><h2>Todavía no has comenzado un itinerario.</h2><p>Elige un destino, configura tus fechas y selecciona un vuelo o alojamiento.</p><Link className="btn btn-primary" to="/destinos">Elegir destino ↗</Link></div>}
  </div>;
}
