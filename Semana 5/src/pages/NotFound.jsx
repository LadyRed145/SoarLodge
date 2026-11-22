import { Link } from 'react-router';
import BrandMark from '../components/BrandMark.jsx';
export default function NotFound() { return <div className="layout-width not-found not-found--postcard">
  <BrandMark className="not-found-mark"/>
  <p className="eyebrow">ERROR 404 · DESVÍO INESPERADO</p>
  <h1>Esta ruta no está en el mapa.</h1>
  <p>Puede que hayas tomado un desvío. Hay nueve destinos esperando tu próxima aventura.</p>
  <Link to="/destinos" className="btn btn-primary">Volver a destinos ↗</Link>
</div>; }
