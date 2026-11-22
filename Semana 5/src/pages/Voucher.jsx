import { Link, useLocation, useParams } from 'react-router';
import { useState } from 'react';
import { readVoucher, VOUCHER_KEY, voucherText } from '../lib/booking.js';
import { usd } from '../lib/pricing.js';
import { destinationVisual } from '../lib/visuals.js';
import Photo from '../components/Photo.jsx';
import BrandMark from '../components/BrandMark.jsx';

function storedVoucher() {
  if (typeof window === 'undefined') return null;
  try { return readVoucher(window.localStorage.getItem(VOUCHER_KEY)); }
  catch { return null; }
}
const niceDate = (value) => new Intl.DateTimeFormat('es-CL', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${value}T12:00:00Z`));

export default function Voucher() {
  const { id } = useParams();
  const location = useLocation();
  const [persisted] = useState(storedVoucher);
  const candidate = location.state?.receipt ?? persisted;
  const voucher = candidate?.bookingId === id && readVoucher(JSON.stringify(candidate));

  function download() {
    if (!voucher) return;
    const blob = new Blob([voucherText(voucher)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${voucher.bookingId}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  if (!voucher) return <div className="layout-width page-pad friendly-empty">
    <span aria-hidden="true">🎟</span>
    <h1>Comprobante no disponible</h1>
    <p>El comprobante más reciente se conserva solo en este navegador. No hay un registro de reservas real.</p>
    <Link className="btn btn-primary" to="/destinos">Explorar destinos ↗</Link>
  </div>;

  const picture = destinationVisual(voucher.destinationId);
  const isPack = Boolean(voucher.flight && voucher.hotel);

  return <div className="layout-width voucher-page voucher-page--sunlit page-pad">
    <div className="voucher-success voucher-welcome" role="status">
      <BrandMark className="voucher-welcome-mark"/>
      <div><span className="tagline">¡TODO LISTO PARA SOÑAR!</span>
        <h1>¡Tu próxima historia ya tiene destino!</h1>
        <p>Este viaje es una simulación académica: no se realizó ninguna reserva ni cobro.</p>
      </div>
    </div>

    <article className="voucher-paper voucher-ticket" aria-label="Voucher de viaje de demostración de Soarlodge">
      <div className="voucher-cover">
        <Photo src={picture.src} fallback={picture.fallback} alt={`Fotografía referencial de ${voucher.destinationName}`} loading="eager" />
        <div className="voucher-cover-shade" aria-hidden="true" />
        <div className="voucher-cover-content">
          <div className="voucher-cover-top"><div className="voucher-ticket-brand"><BrandMark className="voucher-brand-mark"/><strong>soar<span>lodge.</span></strong></div><span className="voucher-ticket-label">✈ ESCAPADA DE DEMOSTRACIÓN</span></div>
          <div className="voucher-cover-main"><p>EL MUNDO TE ESPERA</p><h2>{voucher.destinationName}<span aria-hidden="true">.</span></h2><strong>{voucher.country} · Tu siguiente aventura imaginaria</strong></div>
          <div className="voucher-cover-foot"><span>✦ Viajes con chispa</span><span>100% SIMULACIÓN ACADÉMICA</span></div>
        </div>
      </div>

      <div className="voucher-ticket-status"><span className="voucher-ticket-seal">✓</span><div><strong>Voucher demo emitido</strong><small>¡Qué buena elección! Guarda este recuerdo de tu planificación.</small></div><span className="voucher-ticket-status-badge">SIN VALIDEZ COMERCIAL</span></div>

      <div className="voucher-ticket-identifiers"><div><small>N.º DE COMPROBANTE</small><strong className="voucher-folio">{voucher.bookingId}</strong></div><div><small>FECHA DE EMISIÓN</small><strong>{new Date(voucher.createdAt).toLocaleString('es-CL')}</strong></div><div><small>TU PLAN</small><strong>{isPack ? 'Pack vuelo + alojamiento' : voucher.flight ? 'Solo vuelo' : 'Solo alojamiento'}</strong></div></div>

      <div className="voucher-ticket-main">
        <div className="voucher-section-head"><span aria-hidden="true">✦</span><div><small>LOS DETALLES DE TU ESCAPADA</small><h3>Tu itinerario, de un vistazo</h3></div></div>
        <div className="voucher-trip-pills"><span>👥 {voucher.travelers} {voucher.travelers === 1 ? 'viajero' : 'viajeros'}</span><span>⌂ {voucher.rooms} {voucher.rooms === 1 ? 'habitación' : 'habitaciones'}</span>{voucher.hotel && <span>☀ {voucher.nights} {voucher.nights === 1 ? 'noche' : 'noches'}</span>}</div>
        <div className="voucher-experience-grid">
          {voucher.flight && <section className="voucher-experience voucher-experience--flight" aria-label="Detalle del vuelo simulado"><div className="voucher-experience-icon" aria-hidden="true">✈</div><div><small>01 · TU VUELO</small><h4>{voucher.flight.airline}</h4><span className="voucher-flight-number">{voucher.flight.flightNumber}</span><p className="voucher-route">{voucher.flight.origin} <span aria-hidden="true">✈</span> {voucher.flight.arrival}</p><p>{niceDate(voucher.flight.departureDate)} — {niceDate(voucher.flight.returnDate)}</p></div></section>}
          {voucher.hotel && <section className="voucher-experience voucher-experience--hotel" aria-label="Detalle del alojamiento simulado"><div className="voucher-experience-icon" aria-hidden="true">⌂</div><div><small>{voucher.flight ? '02' : '01'} · TU ALOJAMIENTO</small><h4>{voucher.hotel.name}</h4><p>{voucher.hotel.location}</p><p>{niceDate(voucher.hotel.checkIn)} — {niceDate(voucher.hotel.checkOut)}</p><span className="voucher-flight-number">{voucher.nights} noches de descanso</span></div></section>}
        </div>
      </div>

      <div className="voucher-totals"><div><span className="voucher-eyebrow">TU INVERSIÓN IMAGINARIA</span><h3>Un viaje para recordar <em>☀</em></h3><p>Todos los importes se expresan en USD ficticios.</p></div>
        <div className="voucher-totals-table"><div><span>✈ Vuelos</span><strong>{usd(voucher.flightTotal)}</strong></div><div><span>⌂ Alojamiento</span><strong>{usd(voucher.hotelTotal)}</strong></div><div className="voucher-discount"><span>✦ Promo pack</span><strong>−{usd(voucher.packageDiscount)}</strong></div><div className="voucher-discount"><span>♡ Extra por favorito</span><strong>−{usd(voucher.favoriteDiscount)}</strong></div><div className="voucher-total-highlight"><span>Total de demostración</span><strong>{usd(voucher.total)}</strong></div></div>
      </div>
      <footer className="voucher-ticket-footer"><strong>Gracias por viajar con tu imaginación y Soarlodge. ✈</strong><p>Comprobante ilustrativo: no sirve como pasaje, reserva de hotel, acreditación de pago ni documento de viaje. Fotografía referencial: Unsplash / {picture.credit}.</p></footer>
    </article>
    <div className="voucher-actions"><button className="btn btn-primary" type="button" onClick={() => window.print()}>Imprimir / guardar PDF ↗</button><button className="btn btn-outline" type="button" onClick={download}>Descargar voucher TXT ↓</button><Link className="btn btn-quiet" to="/destinos">Seguir explorando</Link></div>
  </div>;
}
