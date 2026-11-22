/** Precios de demostración. Misma regla en cliente y servidor, sin depender del carrito. */
export const PACKAGE_RATE = 0.08;
export const FAVORITE_RATE = 0.03;
export function calculateTripPrice({ flight = null, hotel = null, travelers = 1, rooms = 1, favorite = false }) {
  if ((!flight && !hotel) || !Number.isInteger(travelers) || travelers < 1 || travelers > 6 ||
      !Number.isInteger(rooms) || rooms < 1 || rooms > 4 ||
      (flight && hotel && (flight.departureDate !== hotel.checkIn || flight.returnDate !== hotel.checkOut))) return null;
  const nights = hotel ? Math.round((Date.parse(`${hotel.checkOut}T12:00:00Z`) - Date.parse(`${hotel.checkIn}T12:00:00Z`)) / 86400000) : 0;
  if (hotel && (nights <= 0 || nights > 60)) return null;
  const flightTotal = flight ? flight.price * travelers : 0;
  const hotelTotal = hotel ? hotel.nightlyPrice * nights * rooms : 0;
  const subtotal = flightTotal + hotelTotal;
  // Descuentos solo sobre PACK vuelo + hotel; cada componente se redondea por separado.
  const isPackage = Boolean(flight && hotel);
  const packageDiscount = isPackage ? Math.round(subtotal * PACKAGE_RATE) : 0;
  const favoriteDiscount = isPackage && favorite ? Math.round(subtotal * FAVORITE_RATE) : 0;
  return { nights, flightTotal, hotelTotal, subtotal, packageDiscount, favoriteDiscount,
    total: subtotal - packageDiscount - favoriteDiscount, currency: 'USD', isPackage };
}

export const usd = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
