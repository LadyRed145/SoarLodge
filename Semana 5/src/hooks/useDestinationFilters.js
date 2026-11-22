import { useEffect, useMemo, useState } from 'react';
import { filterDestinations, sortDestinations } from '../lib/destinations.js';

/** Búsqueda, filtro y ordenamiento locales: no se dispara una nueva petición al cambiar opciones. */
export function useDestinationFilters(destinations, initialSearch = '', initialRegion = 'all') {
  const [search, setSearch] = useState(initialSearch);
  useEffect(() => { setSearch(initialSearch); }, [initialSearch]);
  const [region, setRegion] = useState(initialRegion);
  useEffect(() => { setRegion(initialRegion); }, [initialRegion]);
  const [order, setOrder] = useState('name');
  const filtered = useMemo(() => sortDestinations(filterDestinations(destinations, { search, region }), order), [destinations, search, region, order]);
  const reset = () => { setSearch(''); setRegion('all'); setOrder('name'); };
  return { search, setSearch, region, setRegion, order, setOrder, filtered, reset };
}
