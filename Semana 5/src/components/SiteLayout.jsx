import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { useEffect, useState } from 'react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { usePlannerStore } from '../context/TripPlannerContext.jsx';
import BrandMark from './BrandMark.jsx';
import PageAtmosphere from './PageAtmosphere.jsx';
export default function SiteLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { favorites } = useFavorites();
  const { stored } = usePlannerStore();
  useEffect(() => {
    setOpen(false);
    if (location.hash) requestAnimationFrame(() => {
      try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' }); }
      catch { window.scrollTo(0, 0); }
    });
    else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return <div className="site-shell">
    <button type="button" className="skip-link" onClick={() => document.getElementById('contenido')?.focus()}>Saltar al contenido</button>
    <div className="topnote"><BrandMark className="topnote-mark"/><span className="topnote-message">El mundo te espera · Planea una escapada con chispa</span><BrandMark className="topnote-mark"/><span className="topnote-experience">100% experiencia de demostración</span></div>
    <header className="header"><div className="layout-width header-inner">
      <Link className="brand" to="/" aria-label="Soarlodge, ir al inicio"><BrandMark className="brand-mark"/><span className="brand-stack"><strong>soar<span>lodge.</span></strong><small>VIAJES CON CHISPA</small></span></Link>
      <button type="button" className="mobile-menu-button" aria-expanded={open} aria-controls="site-navigation" onClick={()=>setOpen(!open)}>{open?'Cerrar ✕':'Menú ☰'}</button>
      <nav id="site-navigation" className={`primary-nav ${open?'is-open':''}`} aria-label="Navegación principal">
        <NavLink end to="/">Inicio</NavLink><NavLink to="/destinos">Destinos</NavLink><NavLink to="/favoritos">♡ Favoritos <span className="nav-counter">{favorites.length}</span></NavLink><NavLink to="/mi-viaje">Mi viaje {stored.flightId || stored.hotelId ? <span className="nav-pulse" aria-label="Viaje en preparación">•</span>:null}</NavLink><NavLink to="/nosotros">Nosotros</NavLink>
      </nav>
      <Link className="header-cta" to="/destinos#resultados">Arma tu aventura <span aria-hidden="true">↗</span></Link>
    </div></header>
    <main className="main-content" id="contenido" tabIndex={-1}><PageAtmosphere pathname={location.pathname}/><Outlet/></main>
    <footer className="footer"><div className="layout-width footer-content"><div className="footer-identity"><Link className="footer-brand" to="/"><BrandMark className="brand-mark brand-mark--footer"/> <span>soarlodge.</span></Link><p>Un poquito de sol, muchos lugares por descubrir. Tu viaje comienza aquí.</p><span className="footer-slogan">HECHO PARA GENTE CON GANAS DE MUNDO ☀</span></div><div className="footer-links-panel"><strong>Explora</strong><nav className="footer-nav" aria-label="Enlaces del pie de página"><Link to="/destinos">Destinos</Link><Link to="/favoritos">Favoritos</Link><Link to="/mi-viaje">Mi viaje</Link><Link to="/nosotros">El proyecto</Link></nav></div><div className="footer-card"><span aria-hidden="true">🧳</span><strong>¿Listo para despegar?</strong><p>Arma tu pack con vuelo y hotel.</p><Link to="/destinos#resultados">Encontrar mi lugar ↗</Link></div></div><div className="layout-width footer-bottom"><span>© 2026 Soarlodge · PFY2202 · Semana 5</span><span>Proyecto académico · Tarifas, vuelos, hoteles y promociones ficticios</span></div></footer>
  </div>;
}
