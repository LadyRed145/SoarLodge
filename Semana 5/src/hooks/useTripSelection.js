import { useCallback, useMemo } from 'react';
import { usePlannerStore } from '../context/TripPlannerContext.jsx';
import { buildTripSummary, updateTripSelection } from '../lib/trip-selection.js';
import { canChooseOffer, createPlan, filterOffersByPeriod, getTravelPeriods, updatePlannerSettings } from '../lib/planner.js';

/** Estado por destino + filtros + selección persistente, sin crear reservas. */
export function useTripSelection(destinationId, flights, hotels) {
  const { stored, setStored } = usePlannerStore();
  const periods = useMemo(() => getTravelPeriods(flights, hotels), [flights, hotels]);
  const defaultPeriod = periods[0]?.value ?? '';
  const plan = stored.destinationId === destinationId && periods.some((p) => p.value === stored.period)
    ? stored : createPlan(destinationId, defaultPeriod);
  const visibleFlights = useMemo(() => filterOffersByPeriod(flights, plan.period, 'flight'), [flights, plan.period]);
  const visibleHotels = useMemo(() => filterOffersByPeriod(hotels, plan.period, 'hotel'), [hotels, plan.period]);

  const select = useCallback((kind, id) => setStored((previous) => {
    const current = previous.destinationId === destinationId && periods.some((p) => p.value === previous.period)
      ? previous : createPlan(destinationId, defaultPeriod);
    const option = (kind === 'flight' ? flights : hotels).find((item) => item.id === id);
    if (!option || !canChooseOffer(kind, option, current)) return current;
    const periodDate = kind === 'flight' ? option.departureDate : option.checkIn;
    if (periodDate !== current.period) return current;
    return { ...current, ...updateTripSelection(current, kind, id, { flights, hotels }) };
  }), [setStored, destinationId, periods, defaultPeriod, flights, hotels]);

  const change = useCallback((field, value) => setStored((previous) => {
    const current = previous.destinationId === destinationId && periods.some((p) => p.value === previous.period)
      ? previous : createPlan(destinationId, defaultPeriod);
    return updatePlannerSettings(current, field, value, { flights, hotels });
  }), [setStored, destinationId, periods, defaultPeriod, flights, hotels]);

  const clear = useCallback(() => setStored((previous) => {
    const current = previous.destinationId === destinationId ? previous : createPlan(destinationId, defaultPeriod);
    return { ...current, flightId: null, hotelId: null, notice: '' };
  }), [setStored, destinationId, defaultPeriod]);

  const summary = useMemo(() => buildTripSummary(plan, { flights, hotels }, plan), [plan, flights, hotels]);
  return { selection: plan, settings: plan, summary, periods, flights: visibleFlights, hotels: visibleHotels, select, change, clear };
}
