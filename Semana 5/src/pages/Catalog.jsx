import { Link, useLocation, useSearchParams } from 'react-router';
import { useEffect } from 'react';
import { useApiResource } from '../hooks/useApiResource.js';
import { useDestinationFilters } from '../hooks/useDestinationFilters.js';
import DestinationCard from '../components/DestinationCard.jsx';
import SortControl from '../components/SortControl.jsx';
import { EmptyState, ErrorPanel, LoadingGrid } from '../components/ResourceStatus.jsx';
import CatalogFerrisWheel from '../components/CatalogFerrisWheel.jsx';
import { groupDestinationsByRegion } from '../lib/destinations.js';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const simulated = ['404', '500'].includes(searchParams.get('demoError')) ? searchParams.get('demoError') : null;
  const path = simulated ? `/api/destinations?simulate=${simulated}` : '/api/destinations';
  const destinationsResource = useApiResource(path);
  const regionsResource = useApiResource('/api/regions');
  const destinations = destinationsResource.data?.destinations ?? [];
  const regions = regionsResource.data?.regions ?? [];
  const initialRegion = regions.some((region) => region.id === searchParams.get('region')) ? searchParams.get('region') : 'all';
  const filters = useDestinationFilters(destinations, searchParams.get('q') ?? '', initialRegion);
  const selectedRegion = regions.find((region) => region.id === filters.region);
  const interest = ['vuelos', 'hoteles'].includes(searchParams.get('tipo')) ? searchParams.get('tipo') : null;

  // El ancla de React Router puede intentarse antes de cargar REST. Volvemos a
  // enfocar los resultados una vez disponibles, también al repetir búsquedas.
  useEffect(() => {
    if (location.hash !== '#resultados' || destinationsResource.status !== 'success') return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById('resultados')?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.search, destinationsResource.status]);

  return <div className="layout-width catalog-page">
    <nav className="breadcrumb" aria-label="Ruta de navegación"><Link to="/">Inicio</Link><span aria-hidden="true">/</span><span aria-current="page">Destinos</span></nav>
    <div className="catalog-heading"><div><p className="eyebrow">☀ ELIGE TU PRÓXIMA POSTAL</p><h1>Encuentra tu lugar <em>feliz.</em></h1><p>Explora rincones del mundo, guarda tus favoritos y arma tu propio pack de vuelo + alojamiento.</p></div><div className="catalog-heading__ornament" aria-hidden="true"><span className="catalog-heading__ring" /><span className="catalog-heading__ring catalog-heading__ring--inner" /><CatalogFerrisWheel /></div></div>
    <div className="catalog-layout"><aside className="catalog-sidebar" aria-label="Filtrar destinos por región">
      <p className="sidebar-title">¿QUÉ PARTE DEL MUNDO?</p>
      {regionsResource.status === 'loading' && <p role="status" className="muted">Cargando regiones…</p>}
      {regionsResource.status === 'error' && <div className="sidebar-error" role="alert"><p>No se cargaron las regiones.</p><button type="button" onClick={regionsResource.retry}>Reintentar</button></div>}
      {regionsResource.status === 'success' && <div className="category-nav" role="group" aria-label="Regiones disponibles">
        <button type="button" aria-pressed={filters.region === 'all'} className={filters.region === 'all' ? 'active' : ''} onClick={() => filters.setRegion('all')}>Todas las regiones <span>{destinations.length}</span></button>
        {regions.map((region) => <button type="button" aria-pressed={filters.region === region.id} className={filters.region === region.id ? 'active' : ''} key={region.id} onClick={() => filters.setRegion(region.id)}><span>{region.name}</span><span>{destinations.filter((destination) => destination.region === region.id).length}</span></button>)}
      </div>}
      <div className="sidebar-note"><span aria-hidden="true">✧</span><p>El mejor destino es el que te hace sonreír. 🌞</p></div>
    </aside>
    <section className="catalog-results" id="resultados" aria-label="Catálogo de destinos">
      {interest && <div className="catalog-intent-note" role="note"><span aria-hidden="true">{interest === 'vuelos' ? '✈' : '⌂'}</span><div><strong>{interest === 'vuelos' ? 'Vuelos de demostración' : 'Hoteles de demostración'}</strong><p>Elige un destino: te llevaremos directamente a sus {interest === 'vuelos' ? 'opciones de vuelo' : 'opciones de alojamiento'} ficticias.</p></div></div>}
      <div className="catalog-toolbar"><label className="search-field" htmlFor="catalog-destination-search"><span className="visually-hidden">Buscar por destino, país o actividad</span><span aria-hidden="true">⌕</span><input id="catalog-destination-search" name="destinationSearch" type="search" placeholder="Buscar destino, país o actividad…" value={filters.search} onChange={(event) => filters.setSearch(event.target.value)}/></label><SortControl value={filters.order} onChange={filters.setOrder}/></div>
      {destinationsResource.status === 'loading' && <LoadingGrid message="Cargando destinos desde REST…" count={6}/>}
      {destinationsResource.status === 'error' && <ErrorPanel error={destinationsResource.error} onRetry={destinationsResource.retry}/>}
      {destinationsResource.status === 'success' && <><div className="results-bar"><span><strong>{filters.filtered.length}</strong> {filters.filtered.length === 1 ? 'destino encontrado' : 'destinos encontrados'}</span><span>{selectedRegion?.name ?? 'Todas las regiones'} · Datos simulados</span></div>
        {filters.filtered.length > 0 ? (filters.order === 'region'
          ? <div className="catalog-region-groups">{groupDestinationsByRegion(filters.filtered).map((group) => {
            const regionName = regions.find((region) => region.id === group.id)?.name ?? group.id;
            return <section className="catalog-region-section" key={group.id} aria-labelledby={`catalog-region-${group.id}`}>
              <div className="catalog-region-heading">
                <div className="catalog-region-heading__title"><span aria-hidden="true" className="catalog-region-heading__spark">✧</span><h2 id={`catalog-region-${group.id}`}>{regionName}</h2></div>
                <span className="catalog-region-heading__count">{group.destinations.length} {group.destinations.length === 1 ? 'destino' : 'destinos'}</span>
              </div>
              <div className="destination-grid catalog-destination-grid">{group.destinations.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index} interest={interest}/>)}</div>
            </section>;
          })}</div>
          : <div className="destination-grid catalog-destination-grid">{filters.filtered.map((destination, index) => <DestinationCard key={destination.id} destination={destination} index={index} interest={interest}/>)}</div>)
          : <EmptyState onReset={filters.reset}/>}
      </>}
    </section></div>
  </div>;
}
