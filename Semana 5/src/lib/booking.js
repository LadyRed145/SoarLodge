import { apiUrl } from './api-origin.js';
import { ApiError } from './api.js';
export const VOUCHER_KEY = 'soarlodge:last-voucher:v1';
/** Comprueba la integridad del comprobante devuelto por el servidor mock. */
export function validateVoucher(data) {
  return Boolean(data && data.mode === 'DEMO' && /^SOAR-[A-F\d]{8}$/.test(data.bookingId ?? '') &&
    Number.isFinite(Date.parse(data.createdAt)) && typeof data.destinationName === 'string' &&
    (data.flight?.flightNumber || data.hotel?.name) && (!data.flight || data.flight.flightNumber) && (!data.hotel || data.hotel.name) && Number.isSafeInteger(data.total) && data.total >= 0 &&
    Number.isSafeInteger(data.subtotal) && Number.isSafeInteger(data.packageDiscount) &&
    Number.isSafeInteger(data.favoriteDiscount) && data.total === data.subtotal - data.packageDiscount - data.favoriteDiscount &&
    Number.isInteger(data.travelers) && Number.isInteger(data.rooms));
}
/** Envía una confirmación ficticia; nunca envía ni recibe datos bancarios reales. */
export async function submitDemoBooking(payload, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(apiUrl('/api/bookings'), {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    if (!(response.headers?.get('content-type') ?? '').includes('application/json')) throw new ApiError('La respuesta no es JSON.', { code: 'INVALID_RESPONSE' });
    const result = await response.json();
    if (!response.ok) throw new ApiError(result?.error || 'No se pudo confirmar el pedido de demostración.', { status: response.status, code: result?.code || 'BOOKING_ERROR' });
    if (!validateVoucher(result)) throw new ApiError('El comprobante recibido no es válido.', { code: 'INVALID_VOUCHER' });
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError') throw new ApiError('La confirmación demoró demasiado. Vuelve a intentarlo.', { code: 'TIMEOUT' });
    throw new ApiError('No hay conexión con el servicio de demostración.', { code: 'NETWORK_ERROR' });
  } finally { clearTimeout(timer); }
}
/** Recupera el último voucher solo si sigue cumpliendo el contrato. */
export function readVoucher(raw) {
  try { const result = JSON.parse(raw); return validateVoucher(result) ? result : null; }
  catch { return null; }
}
/** Genera una versión de texto descargable sin incluir información privada. */
export function voucherText(v) {
  if (!validateVoucher(v)) return '';
  return [
    'SOARLODGE · COMPROBANTE DE DEMOSTRACIÓN', `Folio: ${v.bookingId}`,
    `Fecha: ${new Date(v.createdAt).toLocaleString('es-CL')}`,
    `Destino: ${v.destinationName}, ${v.country}`,
    ...(v.flight ? [`Vuelo: ${v.flight.airline} · ${v.flight.flightNumber}`, `Ruta: ${v.flight.origin} → ${v.flight.arrival}`, `Salida: ${v.flight.departureDate} · Regreso: ${v.flight.returnDate}`] : []),
    ...(v.hotel ? [`Hotel: ${v.hotel.name} · ${v.hotel.location}`, `Estadía: ${v.hotel.checkIn} a ${v.hotel.checkOut} · ${v.nights} noches`] : []),
    `Viajeros: ${v.travelers} · Habitaciones: ${v.rooms}`,
    ...(v.flight ? [`Vuelos: USD ${v.flightTotal}`] : []),
    ...(v.hotel ? [`Alojamiento: USD ${v.hotelTotal}`] : []),
    `Subtotal: USD ${v.subtotal}`,
    `Descuento pack: -USD ${v.packageDiscount}`,
    `Descuento favoritos: -USD ${v.favoriteDiscount}`,
    `TOTAL DEMO: USD ${v.total}`,
    '', 'DOCUMENTO FICTICIO · SIN VALIDEZ COMERCIAL',
    'No representa pasaje, reserva hotelera, pago ni confirmación real.',
  ].join('\n');
}
