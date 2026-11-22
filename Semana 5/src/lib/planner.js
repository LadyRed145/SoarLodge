/** Modelo serializable y seguro del planificador. No contiene datos personales. */
export const STORAGE_KEY = 'soarlodge:plan:v1';
export const LIMITS = Object.freeze({ travelers: [1, 6], rooms: [1, 4] });

export const clampInt = (value, min, max) => {
  const n = Number(value);
  return Number.isInteger(n) ? Math.max(min, Math.min(n, max)) : min;
};

export const createPlan = (destinationId = null, period = '') => ({
  destinationId, period, travelers: 1, rooms: 1, flightId: null, hotelId: null, notice: '',
});

/** Corrige datos corruptos, caducos o manipulados del almacenamiento local. */
export function normalizeStoredPlan(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return createPlan();
  const identifier = typeof candidate.destinationId === 'string' && /^[a-z0-9-]{1,70}$/.test(candidate.destinationId)
    ? candidate.destinationId : null;
  const period = typeof candidate.period === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(candidate.period)
    ? candidate.period : '';
  return {
    destinationId: identifier, period,
    travelers: clampInt(candidate.travelers, ...LIMITS.travelers),
    rooms: clampInt(candidate.rooms, ...LIMITS.rooms),
    flightId: typeof candidate.flightId === 'string' && candidate.flightId.length < 120 ? candidate.flightId : null,
    hotelId: typeof candidate.hotelId === 'string' && candidate.hotelId.length < 120 ? candidate.hotelId : null,
    notice: '',
  };
}

export function readStoredPlan(json) {
  try { return normalizeStoredPlan(JSON.parse(json)); }
  catch { return createPlan(); }
}

export function getTravelPeriods(flights = [], hotels = []) {
  const dates = new Set(flights.map((f) => f.departureDate));
  return [...dates].filter((date) => hotels.some((hotel) => hotel.checkIn === date))
    .sort().map((date) => ({ value: date, end: flights.find((f) => f.departureDate === date)?.returnDate }));
}

export function filterOffersByPeriod(items = [], period, kind) {
  const field = kind === 'hotel' ? 'checkIn' : 'departureDate';
  return items.filter((item) => item[field] === period);
}

export function canChooseOffer(kind, item, { travelers = 1, rooms = 1 } = {}) {
  if (!item?.available) return false;
  return kind === 'flight' ? item.seatsLeft >= travelers : kind === 'hotel' && item.roomsLeft >= rooms;
}

export function updatePlannerSettings(previous, field, value, { flights = [], hotels = [] } = {}) {
  if (!['period', 'travelers', 'rooms'].includes(field)) return previous;
  const next = { ...previous, notice: '' };
  if (field === 'period') {
    const options = getTravelPeriods(flights, hotels);
    if (!options.some((option) => option.value === value) || value === previous.period) return previous;
    next.period = value;
    next.flightId = null;
    next.hotelId = null;
    next.notice = 'Actualizamos las fechas. Elige vuelos y hoteles para el nuevo período.';
  } else {
    next[field] = clampInt(value, ...LIMITS[field]);
    const flight = flights.find((item) => item.id === next.flightId);
    const hotel = hotels.find((item) => item.id === next.hotelId);
    if (flight && !canChooseOffer('flight', flight, next)) { next.flightId = null; next.notice = 'Quitamos el vuelo: no tiene cupos suficientes para el grupo.'; }
    if (hotel && !canChooseOffer('hotel', hotel, next)) { next.hotelId = null; next.notice = 'Quitamos el alojamiento: faltan habitaciones para el grupo.'; }
  }
  return next;
}
