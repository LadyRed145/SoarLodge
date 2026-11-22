import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useApiResource } from '../hooks/useApiResource.js';
import DestinationCard from '../components/DestinationCard.jsx';
import HeroFlightTrail from '../components/HeroFlightTrail.jsx';
import Photo from '../components/Photo.jsx';
import { destinationVisual } from '../lib/visuals.js';
import { destinationSearchPath } from '../lib/destinations.js';
import { LoadingGrid, ErrorPanel, EmptyState } from '../components/ResourceStatus.jsx';
export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const resource = useApiResource('/api/destinations');
  const regionsResource = useApiResource('/api/regions');
  const destinations = resource.data?.destinations ?? [];
  const featured = destinations.filter(d=>d.featured).slice(0,4);
  const totalDestinations = destinations.length || 9;
  const submitSearch = (event) => {
    event.preventDefault();
    navigate(destinationSearchPath(search, destinations, regionsResource.data?.regions ?? []));
  };
  // En móvil el toque del botón navega directamente; Enter sigue usando el submit
  // del formulario. preventDefault evita un segundo envío nativo/duplicado.
  const submitMobileTap = (event) => {
    if (window.matchMedia('(max-width: 760px)').matches) submitSearch(event);
  };
  return <>
    <section className="hero"><HeroFlightTrail/><div className="layout-width hero-inner"><div className="hero-copy">
      <span className="hero-pill">☀ HOLA, ¿A DÓNDE NOS VAMOS?</span>
      <h1>La vida es corta.<br/><span>El mundo,</span><br/>enorme.</h1>
      <p className="hero-subtitle">A veces solo necesitas cambiar de paisaje. Encuentra vuelos, hoteles y ese lugar que te hace sentir mariposas en el estómago.</p>
      <div className="action-row"><Link className="btn btn-primary" to="/destinos#resultados">Quiero explorar ↗</Link><Link className="hero-text-link" to="/favoritos">♡ Mis lugares soñados</Link></div>
      <div className="hero-mini-social"><span>✦ ✦ ✦ ✦ ✦</span><p>{totalDestinations} destinos · 2 maneras de enamorarte de cada uno</p></div>
    </div><div className="hero-art" aria-label="Collage de destinos ilustrados"><div className="sun-doodle" aria-hidden="true">✳</div><div className="hero-image hero-image-back"><Photo {...destinationVisual('kioto')} alt="Fotografía de Kioto, Japón" loading="eager"/><span>Kioto ✿</span></div><div className="hero-image hero-image-front"><Photo {...destinationVisual('bali')} alt="Fotografía de los arrozales de Bali, Indonesia" loading="eager"/><span>Nos vemos en Bali ☀</span></div><div className="hero-sticker" aria-hidden="true">✈<small>LET'S<br/>GO!</small></div><span className="hero-art-caption">DONDE HAY GANAS, HAY DESTINO ↗</span></div></div>
      <div className="layout-width hero-search-shell"><form className="hero-search" onSubmit={submitSearch}><div className="search-pictogram" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" style={{ display: "block", flex: "none" }} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" focusable="false"><circle cx="10.5" cy="10.5" r="6.75"/><path d="m15.5 15.5 5 5"/></svg></div><label htmlFor="hero-destination-search"><strong>¿Qué lugar te está llamando?</strong><span>Destino, país o actividad</span></label><input id="hero-destination-search" name="destinationSearch" value={search} onChange={(event)=>setSearch(event.target.value)} type="search" aria-label="Buscar destinos" placeholder="Ej: Japón, playas, senderismo…"/><button className="btn btn-search" type="submit" onClick={submitMobileTap}>Buscar aventura ↗</button></form></div>
    </section>
    <section className="section explore-strip layout-width"><span className="eyebrow">🌎 TU MUNDO, A TU MANERA</span><div className="explore-strip-inner"><h2>Momentos que se viven. <em>No solo se cuentan.</em></h2><p>La próxima gran historia no está en tu pantalla, ¡está allá afuera! Nosotros te ayudamos a encontrar cómo llegar y dónde descansar.</p></div><nav className="benefit-pills" aria-label="Explora las ventajas de Soarlodge"><Link to="/destinos?tipo=vuelos#resultados">✈ Vuelos de demostración</Link><Link to="/destinos?tipo=hoteles#resultados">⌂ Hoteles de demostración</Link><Link to="/favoritos">♡ Promo por favoritos</Link><Link to="/#packs">🎁 Packs con descuento</Link></nav></section>
    <section className="section featured-section" id="inspiracion"><div className="layout-width"><div className="section-head"><div><span className="eyebrow">✳ PARA EMPEZAR A SOÑAR</span><h2>¿Te animas a <em>salir de la rutina?</em></h2><p>Una selección de destinos para tu próxima aventura.</p></div><Link className="section-link" to="/destinos#resultados">Ver los {totalDestinations} destinos ↗</Link></div>
      {resource.status==='loading' && <LoadingGrid message="Preparando los destinos…" count={4}/>}
      {resource.status==='error' && <ErrorPanel error={resource.error} onRetry={resource.retry}/>}
      {resource.status==='success' && (featured.length?<div className="destination-grid featured-grid">{featured.map((d,i)=><DestinationCard destination={d} key={d.id} index={i}/>)}</div>:<EmptyState/>)}
    </div></section>
    <section className="promo-section" id="packs"><div className="layout-width promo-section-inner"><div><span className="promo-badge">🎉 TU COMBO VIAJERO</span><h2>Dos maletas. <em>Un planazo.</em></h2><p>Arma un pack de vuelo + hotel y disfruta de un <strong>8% de descuento de prueba</strong>. Si guardaste ese destino entre tus favoritos, sumamos un <strong>3% extra</strong>.</p><Link className="btn btn-dark" to="/destinos#resultados">Crear mi pack ↗</Link></div><div className="promo-illustration"><div className="promo-circle">11%<small>AHORRO DEMO MÁX.</small></div><div className="promo-suitcase" aria-hidden="true">🧳</div><div className="promo-sun" aria-hidden="true">☀</div></div></div></section>
    <section className="section steps-section layout-width"><div className="section-head"><div><span className="eyebrow">SIMPLE COMO DEBERÍA SER</span><h2>Tres pasos y <em>¡a volar!</em></h2></div></div><div className="journey-steps"><div><span>01 ✈</span><h3>Elige tu lugar</h3><p>Explora destinos y guarda los que te enamoren.</p></div><div><span>02 ⌂</span><h3>Arma tu combo</h3><p>Selecciona fechas, vuelos y un hotel con sus cupos ficticios.</p></div><div><span>03 🎟</span><h3>Guarda tu voucher</h3><p>Confirma una compra de prueba y recibe tu comprobante imprimible.</p></div></div></section>
  </>;
}
