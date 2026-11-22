import { Link, useLocation } from 'react-router';
import { useEffect } from 'react';
import { useTravelOptions } from '../hooks/useTravelOptions.js';
import { useTripSelection } from '../hooks/useTripSelection.js';
import { canChooseOffer } from '../lib/planner.js';
import { ErrorPanel } from './ResourceStatus.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { calculateTripPrice } from '../lib/pricing.js';
import Photo from './Photo.jsx';
import { hotelVisual, destinationVisual } from '../lib/visuals.js';

const usd = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const niceDate = (date) => new Intl.DateTimeFormat('es-CL', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${date}T12:00:00Z`));
const NO_OFFERS = Object.freeze([]);

function Availability({ available, remaining, unit }) {
  return <span className={`offer-availability ${available ? 'is-available' : 'is-full'}`}>
    <span aria-hidden="true">{available ? '●' : '○'}</span>
    {available ? `Disponible · ${remaining} ${unit}` : 'Sin disponibilidad'}
  </span>;
}

export function FlightCard({ flight, selected = false, onSelect = () => {}, neededTravelers = 1 }) {
  const eligible = canChooseOffer('flight', flight, { travelers: neededTravelers });
  return <article className={`offer-card${selected ? ' is-selected' : ''}`} aria-label={`Vuelo ${flight.flightNumber}`}>
    <div className="flight-card-visual"><Photo {...destinationVisual(flight.destinationId)} alt={`Fotografía del destino del vuelo ${flight.arrival}`} loading="lazy"/><span>✈ Una postal del destino</span></div>
    <div className="offer-head"><span className="offer-icon" aria-hidden="true">✈</span><div><p className="offer-type">VUELO DE DEMOSTRACIÓN</p><h4>{flight.airline} <span className="offer-code">{flight.flightNumber}</span></h4></div></div>
    <p className="offer-route"><strong>{flight.origin}</strong><span aria-hidden="true">⟶</span><strong>{flight.arrival}</strong></p>
    <dl className="offer-facts"><div><dt>Salida</dt><dd>{niceDate(flight.departureDate)}</dd></div><div><dt>Regreso</dt><dd>{niceDate(flight.returnDate)}</dd></div></dl>
    <div className="offer-bottom"><div><span className="offer-price-caption">Por persona · ida y vuelta</span><strong className="offer-price">{usd.format(flight.price)}</strong></div><Availability available={flight.available} remaining={flight.seatsLeft} unit="asientos"/></div>
    <button type="button" className={`offer-select${selected ? ' is-active' : ''}`} disabled={!eligible} aria-pressed={selected} onClick={() => onSelect('flight', flight.id)}>
      {!eligible ? (flight.available ? 'No hay cupos para tu grupo' : 'Vuelo no disponible') : selected ? '✓ Quitar vuelo' : 'Elegir vuelo'}
    </button>
  </article>;
}

export function HotelCard({ hotel, selected = false, onSelect = () => {}, neededRooms = 1 }) {
  const eligible = canChooseOffer('hotel', hotel, { rooms: neededRooms });
  const nights = Math.round((Date.parse(`${hotel.checkOut}T12:00:00Z`) - Date.parse(`${hotel.checkIn}T12:00:00Z`)) / 86_400_000);
  return <article className={`offer-card hotel-card${selected ? ' is-selected' : ''}`} aria-label={`Hotel ${hotel.name}`}>
    <div className="hotel-card-visual"><Photo {...hotelVisual(hotel.id)} alt={`Imagen referencial de habitación para ${hotel.name} (no corresponde al hotel ficticio)`} loading="lazy"/><small className="hotel-photo-disclaimer">Imagen referencial · no corresponde a una propiedad real</small><span>{nights} noches de estadía</span></div>
    <div className="hotel-card-content">
      <div className="offer-head"><span className="offer-icon" aria-hidden="true">⌂</span><div><p className="offer-type">ALOJAMIENTO DE DEMOSTRACIÓN</p><h4>{hotel.name}</h4><p className="offer-location">{hotel.location}</p></div></div>
      <dl className="offer-facts"><div><dt>Check-in</dt><dd>{niceDate(hotel.checkIn)}</dd></div><div><dt>Check-out</dt><dd>{niceDate(hotel.checkOut)}</dd></div></dl>
      <ul className="amenities" aria-label="Servicios del hotel">{hotel.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
      <div className="offer-bottom"><div><span className="offer-price-caption">Por habitación y noche</span><strong className="offer-price">{usd.format(hotel.nightlyPrice)}</strong><span className="hotel-stay-price">{usd.format(hotel.nightlyPrice * nights)} por habitación / estadía</span></div><Availability available={hotel.available} remaining={hotel.roomsLeft} unit="habitaciones"/></div>
      <button type="button" className={`offer-select${selected ? ' is-active' : ''}`} disabled={!eligible} aria-pressed={selected} onClick={() => onSelect('hotel', hotel.id)}>
        {!eligible ? (hotel.available ? 'No hay habitaciones suficientes' : 'Alojamiento no disponible') : selected ? '✓ Quitar alojamiento' : 'Elegir alojamiento'}
      </button>
    </div>
  </article>;
}

export function PlannerControls({ periods, settings, onChange }) {
  return <section className="planner-controls" aria-label="Configura tu viaje">
    <div className="planner-controls-title"><span aria-hidden="true">✦</span><div><strong>Personaliza tu búsqueda</strong><small>Las fechas son ejemplos disponibles en el mock GraphQL.</small></div></div>
    <div className="planner-fields">
      <label htmlFor="planner-period">Fechas de viaje
        <select id="planner-period" name="travelPeriod" value={settings.period} onChange={(event) => onChange('period', event.target.value)}>
          {periods.map((period) => <option key={period.value} value={period.value}>{niceDate(period.value)} – {niceDate(period.end)}</option>)}
        </select>
      </label>
      <label htmlFor="planner-travelers">Viajeros
        <select id="planner-travelers" name="travelers" value={settings.travelers} onChange={(event) => onChange('travelers', event.target.value)}>
          {Array.from({ length: 6 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'persona' : 'personas'}</option>)}
        </select>
      </label>
      <label htmlFor="planner-rooms">Habitaciones
        <select id="planner-rooms" name="rooms" value={settings.rooms} onChange={(event) => onChange('rooms', event.target.value)}>
          {Array.from({ length: 4 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'habitación' : 'habitaciones'}</option>)}
        </select>
      </label>
    </div>
  </section>;
}

export function TripSummary({ destinationName, summary, notice = '', onClear = () => {}, compact = false, favorite = false }) {
  const hasItems = Boolean(summary.flight || summary.hotel);
  const pricing = hasItems ? calculateTripPrice({ ...summary, favorite }) : null;
  return <section className={`trip-summary${compact ? ' is-compact' : ''}`} id={compact ? 'mi-itinerario' : undefined} aria-labelledby="trip-title">
    <div className="trip-summary-head"><div><p className="eyebrow">TU PLAN DE VIAJE</p><h3 id="trip-title">Mi itinerario <em>{destinationName}.</em></h3><p>Tu selección se guarda en este navegador.</p></div><span className="trip-progress">{Number(Boolean(summary.flight)) + Number(Boolean(summary.hotel))} de 2</span></div>
    <div className="trip-summary-meta">{summary.travelers} {summary.travelers === 1 ? 'viajero' : 'viajeros'} · {summary.rooms} {summary.rooms === 1 ? 'habitación' : 'habitaciones'}</div>
    <div className="trip-summary-grid">
      <div className="trip-summary-item"><span className="trip-summary-icon" aria-hidden="true">✈</span><div><strong>Vuelo</strong>{summary.flight ? <><p>{summary.flight.airline} · {summary.flight.flightNumber}</p><small>{niceDate(summary.flight.departureDate)} – {niceDate(summary.flight.returnDate)}</small><span className="trip-summary-price">{usd.format(summary.flightTotal)}</span></> : <p className="trip-placeholder">Aún no has elegido vuelo.</p>}</div></div>
      <div className="trip-summary-item"><span className="trip-summary-icon" aria-hidden="true">⌂</span><div><strong>Alojamiento</strong>{summary.hotel ? <><p>{summary.hotel.name}</p><small>{summary.nights} noches · {niceDate(summary.hotel.checkIn)} – {niceDate(summary.hotel.checkOut)}</small><span className="trip-summary-price">{usd.format(summary.hotelTotal)}</span></> : <p className="trip-placeholder">Aún no has elegido alojamiento.</p>}</div></div>
    </div>
    {notice && <p className="trip-notice" role="status">{notice}</p>}
    {(summary.flight || summary.hotel) && <div className="trip-summary-footer"><div><span>Subtotal del viaje</span><strong>{usd.format(summary.total)}</strong><small>Vuelos × viajeros + noches × habitaciones. USD ficticios.</small>{pricing && <div className="offer-savings"><p>🎁 Pack vuelo + hotel (−8%): <b>−{usd.format(pricing.packageDiscount)}</b></p><p>♡ Extra favorito (−3%): <b>{pricing.isPackage ? (favorite ? `−${usd.format(pricing.favoriteDiscount)}` : 'Guarda el destino para activarlo') : 'Disponible con pack completo'}</b></p><strong className="final-price">Total con promociones: {usd.format(pricing.total)}</strong></div>}</div><button className="trip-clear" type="button" onClick={onClear}>Limpiar mi selección</button></div>}
    <p className={`trip-summary-status${summary.complete ? ' is-complete' : ''}`} role="status" aria-live="polite">{summary.complete ? '✓ Itinerario de demostración completo. ¡Ya tienes vuelo y alojamiento para las mismas fechas!' : hasItems ? 'Puedes continuar con tu selección. ¡Añade vuelo + hotel para activar las promociones del pack!' : 'Elige un vuelo, un alojamiento o ambos para armar tu viaje.'}</p>
    {compact && <Link className="trip-review-link" to="/mi-viaje">Ver resumen completo ↗</Link>}
    {hasItems && <Link className="btn btn-primary trip-checkout-link" to="/checkout">Continuar al pago de prueba ↗</Link>}
  </section>;
}

export default function TravelOptions({ destinationId, destinationName }) {
  const location = useLocation();
  const resource = useTravelOptions(destinationId);
  const flights = resource.data?.flights ?? NO_OFFERS;
  const hotels = resource.data?.hotels ?? NO_OFFERS;
  const trip = useTripSelection(destinationId, flights, hotels);
  const { isFavorite } = useFavorites();

  // El enlace desde Inicio lleva a la sección específica cuando GraphQL ya cargó.
  useEffect(() => {
    if (resource.status !== 'success') return undefined;
    const anchor = location.hash.slice(1);
    if (anchor !== 'vuelos' && anchor !== 'hoteles') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(anchor)?.scrollIntoView({
        behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'instant' : 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [resource.status, destinationId, location.hash]);

  return <section className="travel-options" id="opciones" aria-labelledby="options-title">
    <div className="options-intro"><div><p className="eyebrow">SOARLODGE TRIP BUILDER ☀</p><h2 id="options-title">Arma tu <em>pack ideal.</em></h2><p>Combina tu vuelo y alojamiento en {destinationName}. Los packs tienen 8% de descuento ficticio; guardar el destino como favorito suma un 3% extra.</p></div><div className="options-emblem" aria-hidden="true">✈<span>+</span>⌂</div></div>
    {resource.status === 'loading' && <div className="options-loading" role="status" aria-live="polite"><span className="spinner" aria-hidden="true"/> Consultando vuelos y hoteles mediante GraphQL…</div>}
    {resource.status === 'error' && <ErrorPanel error={resource.error} onRetry={resource.retry}/>}
    {resource.status === 'success' && <>
      <PlannerControls periods={trip.periods} settings={trip.settings} onChange={trip.change}/>
      <div className="travel-planner-layout">
        <div className="travel-offers-main">
          <section id="vuelos" className="offer-section" aria-labelledby="flights-title"><div className="offer-section-head"><div><p className="eyebrow">01 · ARRANQUEMOS</p><h3 id="flights-title">Elige tu <em>vuelo.</em></h3></div><span>{trip.flights.length} opciones para tus fechas</span></div>
            {trip.flights.length ? <div className="offer-grid">{trip.flights.map((flight) => <FlightCard key={flight.id} flight={flight} neededTravelers={trip.settings.travelers} selected={trip.summary.flight?.id === flight.id} onSelect={trip.select}/>)}</div> : <p className="offers-empty">No hay vuelos de ejemplo en esas fechas. Elige otro período.</p>}
          </section>
          <section id="hoteles" className="offer-section" aria-labelledby="hotels-title"><div className="offer-section-head"><div><p className="eyebrow">02 · TU LUGAR EN EL MUNDO</p><h3 id="hotels-title">Escoge tu <em>alojamiento.</em></h3></div><span>{trip.hotels.length} opciones para tus fechas</span></div>
            {trip.hotels.length ? <div className="offer-grid">{trip.hotels.map((hotel) => <HotelCard key={hotel.id} hotel={hotel} neededRooms={trip.settings.rooms} selected={trip.summary.hotel?.id === hotel.id} onSelect={trip.select}/>)}</div> : <p className="offers-empty">No hay hoteles de ejemplo en esas fechas. Elige otro período.</p>}
          </section>
        </div>
        <aside className="trip-summary-sticky" aria-label="Resumen de tu viaje">
          <TripSummary compact favorite={isFavorite(destinationId)} destinationName={destinationName} summary={trip.summary} notice={trip.selection.notice} onClear={trip.clear}/>
        </aside>
      </div>
    </>}
    <p className="options-disclaimer">✳ Todas las ofertas, precios, promociones y cupos son ficticios. El checkout no cobra dinero ni emite reservas reales.</p>
  </section>;
}
