import { randomUUID } from 'node:crypto';
import { destinations } from './data.mjs';
import { flights, hotels } from './travel-data.mjs';
import { calculateTripPrice } from '../src/lib/pricing.js';
import { validTravelerName, validTravelerEmail } from '../src/lib/customer-validation.js';
const LIMIT = 16_384;
export class BookingError extends Error {
  constructor(message, status = 400, code = 'INVALID_BOOKING') { super(message); this.status = status; this.code = code; }
}
export async function readBookingJSON(req) {
  if (!String(req.headers['content-type'] ?? '').toLowerCase().includes('application/json'))
    throw new BookingError('Debes enviar JSON.', 415, 'INVALID_CONTENT_TYPE');
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString('utf8');
    if (Buffer.byteLength(raw, 'utf8') > LIMIT) throw new BookingError('Solicitud demasiado extensa.', 413, 'PAYLOAD_TOO_LARGE');
  }
  try { return JSON.parse(raw); } catch { throw new BookingError('JSON inválido.', 400, 'INVALID_JSON'); }
}
/** Venta ficticia. Valida contra los catálogos del servidor y recalcula precios. */
export function createDemoBooking(payload) {
  const name = payload?.customer?.name;
  const email = payload?.customer?.email;
  if (!validTravelerName(name) || !validTravelerEmail(email))
    throw new BookingError('Ingresa nombre y correo válidos para la simulación.', 400, 'INVALID_CUSTOMER');
  const destination = destinations.find((d) => d.id === payload?.destinationId);
  const flight = payload?.flightId ? flights.find((f) => f.id === payload.flightId) : null;
  const hotel = payload?.hotelId ? hotels.find((h) => h.id === payload.hotelId) : null;
  if (!destination || (!flight && !hotel) || (payload.flightId && !flight) || (payload.hotelId && !hotel) || (flight && flight.destinationId !== destination.id) || (hotel && hotel.destinationId !== destination.id))
    throw new BookingError('Las ofertas no pertenecen al mismo destino.', 400, 'INVALID_OFFERS');
  if (!Number.isInteger(payload.travelers) || payload.travelers < 1 || payload.travelers > 6 ||
      !Number.isInteger(payload.rooms) || payload.rooms < 1 || payload.rooms > 4)
    throw new BookingError('Selecciona entre 1 y 6 viajeros y entre 1 y 4 habitaciones.', 400, 'INVALID_QUANTITY');
  if ((flight && (!flight.available || flight.seatsLeft < payload.travelers)) || (hotel && (!hotel.available || hotel.roomsLeft < payload.rooms)))
    throw new BookingError('Las ofertas seleccionadas ya no tienen cupos suficientes.', 409, 'NO_AVAILABILITY');
  const pricing = calculateTripPrice({ flight, hotel, travelers: payload.travelers,
    rooms: payload.rooms, favorite: payload.favorite === true });
  if (!pricing) throw new BookingError('Las fechas del vuelo y hotel deben coincidir.', 400, 'INCOMPATIBLE_DATES');
  if (!['demo-card', 'demo-transfer'].includes(payload.paymentMethod))
    throw new BookingError('Elige un método de pago de demostración válido.', 400, 'INVALID_PAYMENT');
  // No se cobra, no se reserva inventario y no se almacena el cliente.
  return {
    mode: 'DEMO', bookingId: `SOAR-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(), destinationId: destination.id, destinationName: destination.name,
    country: destination.country,
    flight: flight ? { id: flight.id, airline: flight.airline, flightNumber: flight.flightNumber, origin: flight.origin,
      arrival: flight.arrival, departureDate: flight.departureDate, returnDate: flight.returnDate } : null,
    hotel: hotel ? { id: hotel.id, name: hotel.name, location: hotel.location, checkIn: hotel.checkIn, checkOut: hotel.checkOut } : null,
    travelers: payload.travelers, rooms: payload.rooms,
    favoriteApplied: payload.favorite === true, paymentMethod: payload.paymentMethod, ...pricing,
    message: 'Confirmación exclusivamente de demostración. No se efectuó ningún cobro ni reserva.',
  };
}
