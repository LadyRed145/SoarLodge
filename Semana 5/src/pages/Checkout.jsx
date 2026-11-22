import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { usePlannerStore } from '../context/TripPlannerContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useTravelOptions } from '../hooks/useTravelOptions.js';
import { useApiResource } from '../hooks/useApiResource.js';
import { buildTripSummary } from '../lib/trip-selection.js';
import { calculateTripPrice, usd } from '../lib/pricing.js';
import { submitDemoBooking, VOUCHER_KEY } from '../lib/booking.js';
import { createPlan } from '../lib/planner.js';
import { ErrorPanel } from '../components/ResourceStatus.jsx';
import BrandMark from '../components/BrandMark.jsx';
import Photo from '../components/Photo.jsx';
import { destinationVisual } from '../lib/visuals.js';
import { cleanTravelerNameInput, validTravelerName, validTravelerEmail } from '../lib/customer-validation.js';
export default function Checkout() {
  const { stored, setStored } = usePlannerStore();
  const { isFavorite } = useFavorites();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ name: '', email: '' });
  const [touched, setTouched] = useState({ name: false, email: false });
  const [method, setMethod] = useState('demo-card');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const requestLock = useRef(false);
  const destinationId = stored.destinationId;
  const destination = useApiResource(destinationId ? `/api/destinations/${encodeURIComponent(destinationId)}` : null);
  const travel = useTravelOptions(destinationId);
  const summary = buildTripSummary(stored, { flights: travel.data?.flights ?? [], hotels: travel.data?.hotels ?? [] }, stored);
  const favorite = isFavorite(destinationId);
  const price = summary.flight || summary.hotel ? calculateTripPrice({ ...summary, favorite }) : null;
  async function submit(event) {
    event.preventDefault();
    if (requestLock.current || !price || !agree || destination.status !== 'success') return;
    if (!validTravelerName(customer.name) || !validTravelerEmail(customer.email.trim())) {
      setTouched({ name: true, email: true });
      setError('Verifica tu nombre y correo electrónico');
      return;
    }
    requestLock.current = true; setPending(true); setError('');
    try {
      const receipt = await submitDemoBooking({ destinationId, flightId: summary.flight?.id ?? null, hotelId: summary.hotel?.id ?? null,
        travelers: stored.travelers, rooms: stored.rooms, favorite, paymentMethod: method,
        customer: { name: customer.name.trim(), email: customer.email.trim() } });
      try { window.localStorage.setItem(VOUCHER_KEY, JSON.stringify(receipt)); }
      catch { /* el comprobante se mostrará igualmente si el contexto admite persistencia */ }
      setStored(createPlan());
      navigate(`/comprobante/${receipt.bookingId}`, { replace: true, state: { receipt } });
    } catch (cause) { setError(cause.message); }
    finally { requestLock.current = false; setPending(false); }
  }
  if (!destinationId) return <div className="layout-width page-pad friendly-empty"><span aria-hidden="true">🧳</span><h1>Primero, elige tu aventura</h1><p>Necesitas elegir al menos un vuelo o un hotel antes de confirmar tu compra de demostración.</p><Link className="btn btn-primary" to="/destinos">Explorar destinos ↗</Link></div>;
  if (destination.status === 'error') return <div className="layout-width page-pad"><ErrorPanel error={destination.error} onRetry={destination.retry}/></div>;
  if (travel.status === 'error') return <div className="layout-width page-pad"><ErrorPanel error={travel.error} onRetry={travel.retry}/></div>;
  if (destination.status !== 'success' || travel.status !== 'success') return <div className="layout-width page-pad" role="status">Preparando tu checkout de demostración…</div>;
  if (!price) return <div className="layout-width page-pad friendly-empty"><span aria-hidden="true">✈</span><h1>Tu itinerario está incompleto</h1><p>Selecciona un vuelo, un alojamiento o ambos para continuar. Si eliges ambos, las fechas deben coincidir.</p><Link className="btn btn-primary" to={`/destinos/${destinationId}#opciones`}>Completar selección ↗</Link></div>;
  return <div className="layout-width checkout-page page-pad">
    <nav className="breadcrumb"><Link to="/">Inicio</Link><span>/</span><Link to="/mi-viaje">Mi viaje</Link><span>/</span><span>Checkout demo</span></nav>
    <div className="page-heading checkout-page-heading"><span className="tagline">CASI, CASI EN TU DESTINO</span><h1>Haz la maleta. <em>Nosotras ponemos las ganas.</em></h1><p>Último paso de nuestra simulación: revisa tu pack y genera tu voucher. No procesamos pagos ni creamos reservas reales.</p></div>
    <div className="checkout-layout"><form className="checkout-form-card" onSubmit={submit}>
      <div className="step-heading"><span>01</span><div><h2>Datos del viajero</h2><p>Solo para validar la simulación; no guardamos estos datos en el voucher.</p></div></div>
      <div className="checkout-fields">
        <label htmlFor="checkout-customer-name">Nombre completo
          <input id="checkout-customer-name" name="customerName" required autoComplete="name" minLength="2" maxLength="90"
            value={customer.name} onChange={(e) => setCustomer(previous => ({ ...previous, name: cleanTravelerNameInput(e.target.value) }))}
            onBlur={() => setTouched(previous => ({ ...previous, name: true }))}
            aria-invalid={touched.name && !validTravelerName(customer.name)}
            aria-describedby={touched.name && !validTravelerName(customer.name) ? 'checkout-name-error' : undefined}
            placeholder="Tu nombre" />
          {touched.name && !validTravelerName(customer.name) && <small id="checkout-name-error" className="checkout-field-error">Escribe al menos dos letras, sin números ni signos.</small>}
        </label>
        <label htmlFor="checkout-customer-email">Correo electrónico
          <input id="checkout-customer-email" name="customerEmail" required type="email" autoComplete="email" maxLength="150"
            value={customer.email} onChange={(e) => setCustomer(previous => ({ ...previous, email: e.target.value }))}
            onBlur={() => setTouched(previous => ({ ...previous, email: true }))}
            aria-invalid={touched.email && !validTravelerEmail(customer.email.trim())}
            aria-describedby={touched.email && !validTravelerEmail(customer.email.trim()) ? 'checkout-email-error' : undefined}
            placeholder="correo@ejemplo.com" />
          {touched.email && !validTravelerEmail(customer.email.trim()) && <small id="checkout-email-error" className="checkout-field-error">Ingresa un correo válido, por ejemplo nombre@dominio.cl.</small>}
        </label>
      </div>
      <div className="step-heading step-gap"><span>02</span><div><h2>Forma de pago ficticia</h2><p>No ingreses datos bancarios reales. Este formulario no cobra dinero.</p></div></div>
      <div className="payment-options" role="radiogroup" aria-label="Método de demostración">
        <label htmlFor="checkout-method-card" className={method==='demo-card'?'chosen':''}><input id="checkout-method-card" type="radio" name="method" value="demo-card" checked={method==='demo-card'} onChange={()=>setMethod('demo-card')}/><span aria-hidden="true">▣</span><strong>Tarjeta simulada</strong><small>Sin número de tarjeta</small></label>
        <label htmlFor="checkout-method-transfer" className={method==='demo-transfer'?'chosen':''}><input id="checkout-method-transfer" type="radio" name="method" value="demo-transfer" checked={method==='demo-transfer'} onChange={()=>setMethod('demo-transfer')}/><span aria-hidden="true">⇄</span><strong>Transferencia simulada</strong><small>Sin datos bancarios</small></label>
      </div>
      <label className="accept-demo" htmlFor="checkout-accept-demo"><input id="checkout-accept-demo" name="acceptDemo" type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} required/><span>Entiendo que este es un pedido académico de demostración, sin cobros, reservas ni pasajes reales.</span></label>
      {error && <p className="form-error" role="alert">{error}. Revisa tu selección y vuelve a intentarlo.</p>}
      <button className="btn btn-primary checkout-button" type="submit" disabled={!agree || pending}>{pending?'Generando comprobante…':'Confirmar compra de prueba ↗'}</button>
      <p className="tiny-note">Tus precios se recalculan en el servidor. No se almacenan el nombre ni el correo.</p>
    </form>
    <aside className="checkout-ticket checkout-ticket--postcard"><div className="checkout-ticket-brand"><BrandMark className="checkout-brand-mark"/><span className="ticket-overline">SOARLODGE · TU VIAJE</span></div><Photo {...destinationVisual(destinationId)} alt={`Fotografía referencial de ${destination.data.destination.name}`} loading="lazy"/><div className="checkout-ticket-body"><h2>{destination.data.destination.name}</h2><p>{destination.data.destination.country} · {summary.hotel ? `${summary.nights} noches · ` : ''}{stored.travelers} viajeros</p><hr/>{summary.flight && <div><span>Vuelo</span><strong>{summary.flight.airline}</strong></div>}{summary.hotel && <div><span>Alojamiento</span><strong>{summary.hotel.name}</strong></div>}<div><span>Vuelos</span><strong>{usd(price.flightTotal)}</strong></div><div><span>Hotel</span><strong>{usd(price.hotelTotal)}</strong></div><div><span>Descuento pack 8%</span><strong className="savings">−{usd(price.packageDiscount)}</strong></div><div><span>Extra favoritos 3%</span><strong className="savings">−{usd(price.favoriteDiscount)}</strong></div><div className="ticket-total"><span>Total ficticio</span><strong>{usd(price.total)}</strong></div><small>Los descuentos solo se aplican a packs completos de vuelo + hotel. Valores ficticios en USD.</small></div></aside>
    </div>
  </div>;
}
