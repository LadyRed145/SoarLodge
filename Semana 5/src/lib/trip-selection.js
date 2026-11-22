/** Selección temporal del itinerario; nunca crea reservas ni modifica inventario. */
export function emptyTripSelection() {
  return { flightId: null, hotelId: null, notice: '' };
}

export function datesMatch(flight, hotel) {
  return flight.departureDate === hotel.checkIn && flight.returnDate === hotel.checkOut;
}

/** Cambia una oferta; si sus fechas no coinciden, retira la selección incompatible. */
export function updateTripSelection(current, kind, optionId, { flights = [], hotels = [] }) {
  if (kind !== 'flight' && kind !== 'hotel') return current;
  const options = kind === 'flight' ? flights : hotels;
  const option = options.find((item) => item.id === optionId);
  if (!option?.available) return current;

  if (kind === 'flight') {
    const flightId = current.flightId === optionId ? null : optionId;
    const selectedHotel = hotels.find((hotel) => hotel.id === current.hotelId);
    const incompatible = flightId !== null && selectedHotel && !datesMatch(option, selectedHotel);
    return {
      flightId,
      hotelId: incompatible ? null : current.hotelId,
      notice: incompatible ? 'Quitamos el alojamiento anterior porque sus fechas no coinciden con el nuevo vuelo.' : '',
    };
  }

  const hotelId = current.hotelId === optionId ? null : optionId;
  const selectedFlight = flights.find((flight) => flight.id === current.flightId);
  const incompatible = hotelId !== null && selectedFlight && !datesMatch(selectedFlight, option);
  return {
    flightId: incompatible ? null : current.flightId,
    hotelId,
    notice: incompatible ? 'Quitamos el vuelo anterior porque sus fechas no coinciden con el nuevo alojamiento.' : '',
  };
}

/** Total de demostración: un boleto por viajero y una habitación por cada noche. */
export function buildTripSummary(selection, { flights = [], hotels = [] }, { travelers = 1, rooms = 1 } = {}) {
  const flight = flights.find((item) => item.id === selection.flightId && item.available && item.seatsLeft >= travelers) ?? null;
  const hotel = hotels.find((item) => item.id === selection.hotelId && item.available && item.roomsLeft >= rooms) ?? null;
  const nights = hotel ? Math.round((Date.parse(`${hotel.checkOut}T12:00:00Z`) - Date.parse(`${hotel.checkIn}T12:00:00Z`)) / 86_400_000) : 0;
  const flightTotal = flight ? flight.price * travelers : 0;
  const hotelTotal = hotel ? hotel.nightlyPrice * nights * rooms : 0;
  return {
    flight, hotel, nights, flightTotal, hotelTotal, travelers, rooms,
    total: flightTotal + hotelTotal,
    complete: Boolean(flight && hotel && datesMatch(flight, hotel)),
  };
}
