import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createPlan, readStoredPlan, STORAGE_KEY } from '../lib/planner.js';

const TripPlannerContext = createContext(null);

function loadPlan() {
  try { return readStoredPlan(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return createPlan(); }
}

/** El plan sobrevive al cambio de rutas y a una recarga del navegador. */
export function TripPlannerProvider({ children }) {
  const [stored, setStored] = useState(loadPlan);
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, notice: '' })); }
    catch { /* El navegador puede bloquear almacenamiento; la sesión sigue funcionando. */ }
  }, [stored]);
  const value = useMemo(() => ({ stored, setStored }), [stored]);
  return <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>;
}

export function usePlannerStore() {
  const context = useContext(TripPlannerContext);
  if (!context) throw new Error('El planificador debe estar dentro de TripPlannerProvider.');
  return context;
}
