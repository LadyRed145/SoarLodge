/** Validaciones de contratos de vuelos y hoteles provenientes del mock GraphQL. */
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const nonnegativeInt = (value) => Number.isInteger(value) && value >= 0;
const positivePrice = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;

export function validateTravelOptions(data, destinationId) {
  if (!data || !Array.isArray(data.flights) || !Array.isArray(data.hotels)) return false;
  const validFlight = (flight) => flight && nonempty(flight.id) && flight.destinationId === destinationId
    && nonempty(flight.airline) && nonempty(flight.flightNumber) && nonempty(flight.origin) && nonempty(flight.arrival)
    && isoDate(flight.departureDate) && isoDate(flight.returnDate) && flight.returnDate >= flight.departureDate
    && positivePrice(flight.price) && flight.currency === 'USD' && typeof flight.available === 'boolean'
    && nonnegativeInt(flight.seatsLeft) && (flight.available === (flight.seatsLeft > 0));
  const validHotel = (hotel) => hotel && nonempty(hotel.id) && hotel.destinationId === destinationId
    && nonempty(hotel.name) && nonempty(hotel.location) && isoDate(hotel.checkIn) && isoDate(hotel.checkOut)
    && hotel.checkOut > hotel.checkIn && positivePrice(hotel.nightlyPrice) && hotel.currency === 'USD'
    && Array.isArray(hotel.amenities) && hotel.amenities.every(nonempty)
    && typeof hotel.available === 'boolean' && nonnegativeInt(hotel.roomsLeft)
    && (hotel.available === (hotel.roomsLeft > 0));
  return data.flights.every(validFlight) && data.hotels.every(validHotel);
}
