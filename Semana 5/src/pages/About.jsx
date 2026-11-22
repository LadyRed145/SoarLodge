import { Link } from 'react-router';
import BrandMark from '../components/BrandMark.jsx';

export default function About() {
  return <div className="layout-width about-page"><nav className="breadcrumb" aria-label="Ruta de navegación"><Link to="/">Inicio</Link><span aria-hidden="true">/</span><span aria-current="page">Nosotros</span></nav>
    <div className="about-heading"><p className="eyebrow">☀ UN POCO SOBRE NOSOTROS</p><h1>Viajemos con <em>más alegría.</em></h1><p>Soarlodge es una experiencia académica de planificación de viajes que conecta paisajes, culturas y la curiosidad de descubrir.</p><div className="about-brand-stamp" aria-hidden="true"><BrandMark className="about-brand-mark"/><small>EXPLORA · DESCUBRE · DISFRUTA</small></div></div>
    <div className="about-panels"><article><span className="about-icon" aria-hidden="true">✦</span><h2>Explora libremente</h2><p>Revisa destinos organizados por región, descubre sus actividades y elige los lugares que más te interesen.</p></article><article><span className="about-icon" aria-hidden="true">◎</span><h2>Tecnología al servicio del viaje</h2><p>Consultamos destinos con REST y vuelos y hoteles con GraphQL, conservando React Router, hooks reutilizables y estados de carga o error.</p></article><article><span className="about-icon" aria-hidden="true">↗</span><h2>Planifica en un solo lugar</h2><p>Guarda favoritos, combina vuelos con hoteles, consigue promociones de ejemplo y confirma una compra ficticia con voucher imprimible.</p></article></div>
    <div className="about-disclaimer"><strong>Proyecto educativo · PFY2202, Semana 5.</strong><p>Los destinos se presentan con contenido ilustrativo. No somos una agencia operativa ni mostramos inventario o tarifas reales.</p></div>
    <Link to="/destinos" className="btn btn-primary">Explorar destinos ↗</Link>
  </div>;
}
