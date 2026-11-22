import { Link } from 'react-router';

export function LoadingGrid({ message = 'Buscando destinos…', count = 6 }) {
  return <section aria-busy="true" aria-live="polite" className="results-state">
    <p className="loading-message"><span className="spinner" aria-hidden="true" />{message}</p>
    <div className="destination-grid" aria-hidden="true">{Array.from({ length: count }, (_, index) =>
      <div className="skeleton-card" key={index}><div className="skeleton-image" /><span className="skeleton-line"/><span className="skeleton-line short"/></div>)}</div>
  </section>;
}

export function ErrorPanel({ error, onRetry }) {
  return <section className="error-panel" role="alert">
    <div className="error-symbol" aria-hidden="true">!</div>
    <div>
      <p className="eyebrow">RUTA INTERRUMPIDA</p>
      <h2>No pudimos cargar esta ruta</h2>
      <p>{error?.message || 'Ocurrió un error inesperado.'}</p>
      <p className="error-hint">{error?.status === 404 ? 'El destino puede no existir. Puedes volver al catálogo.' : 'Revisa tu conexión y confirma que los servicios REST y GraphQL mock estén activos.'}</p>
      <div className="action-row"><button className="btn btn-primary" type="button" onClick={onRetry}>↻ Reintentar</button><Link className="btn btn-outline" to="/destinos">Ver destinos</Link></div>
    </div>
  </section>;
}

export function EmptyState({ onReset }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">⌕</span><h2>No encontramos ese destino</h2><p>Prueba otra búsqueda, región o actividad.</p>{onReset && <button type="button" className="btn btn-outline" onClick={onReset}>Limpiar filtros</button>}</div>;
}
