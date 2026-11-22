/** Ofertas 100 % ficticias. Tres fechas y dos alternativas por tipo/destino. */
import { destinations } from './data.mjs';

const routeConfig = {
  'torres-del-paine': { airport: 'Puerto Natales (PNT)', flight: 195, hotel: 85, hotels: ['Refugio del Viento', 'Mirador Austral'] },
  'kioto': { airport: 'Osaka-Kansai (KIX)', flight: 1180, hotel: 140, hotels: ['Jardines de Kamo', 'Rincón del Bambú'] },
  'reikiavik': { airport: 'Keflavík (KEF)', flight: 1320, hotel: 185, hotels: ['Aurora del Norte', 'Casa de Lava'] },
  'lisboa': { airport: 'Lisboa (LIS)', flight: 1060, hotel: 115, hotels: ['Terrazas del Tajo', 'Azulejo Boutique'] },
  'marrakech': { airport: 'Marrakech (RAK)', flight: 1380, hotel: 100, hotels: ['Riad de la Luna', 'Palacio de los Jardines'] },
  'bali': { airport: 'Denpasar (DPS)', flight: 1550, hotel: 120, hotels: ['Arrozales del Alba', 'Brisa de Ubud'] },
  'banff': { airport: 'Calgary (YYC)', flight: 940, hotel: 155, hotels: ['Bosque Esmeralda', 'Lago de Cristal'] },
  'tofino': { airport: 'Tofino (YAZ)', flight: 980, hotel: 165, hotels: ['Bruma del Pacífico', 'Cedros del Norte'] },
  'sydney': { airport: 'Sídney (SYD)', flight: 1430, hotel: 175, hotels: ['Bahía del Sur', 'Horizonte Pacífico'] },
};

export const datePairs = Object.freeze([
  { departure: '2027-01-15', return: '2027-01-22' },
  { departure: '2027-02-12', return: '2027-02-19' },
  { departure: '2027-03-12', return: '2027-03-19' },
]);

export const flights = Object.freeze(destinations.flatMap((destination, destinationIndex) => {
  const config = routeConfig[destination.id];
  return datePairs.flatMap((dates, periodIndex) => [0, 1].map((variant) => {
    const seatsLeft = variant === 0 ? 8 + destinationIndex : (destinationIndex % 2 === 0 ? 3 : 0);
    return {
      id: `vuelo-${destination.id}-${periodIndex + 1}-${variant + 1}`,
      destinationId: destination.id,
      airline: variant === 0 ? 'Soarlodge Demo Air' : 'Horizonte Demo Airlines',
      flightNumber: `SL${String(101 + destinationIndex * 6 + periodIndex * 2 + variant)}`,
      origin: 'Santiago (SCL)', arrival: config.airport,
      departureDate: dates.departure, returnDate: dates.return,
      price: config.flight + periodIndex * 60 + variant * 75, currency: 'USD',
      available: seatsLeft > 0, seatsLeft,
    };
  }));
}));

export const hotels = Object.freeze(destinations.flatMap((destination, destinationIndex) => {
  const config = routeConfig[destination.id];
  return datePairs.flatMap((dates, periodIndex) => [0, 1].map((variant) => {
    const roomsLeft = variant === 0 ? 3 + destinationIndex : (destinationIndex % 2 === 1 ? 2 : 0);
    return {
      id: `hotel-${destination.id}-${periodIndex + 1}-${variant + 1}`,
      destinationId: destination.id,
      name: config.hotels[variant], location: destination.location,
      checkIn: dates.departure, checkOut: dates.return,
      nightlyPrice: config.hotel + periodIndex * 15 + variant * 35,
      currency: 'USD',
      amenities: variant === 0 ? ['Wi-Fi', 'Desayuno', 'Recepción 24 h'] : ['Wi-Fi', 'Vista panorámica', 'Desayuno'],
      available: roomsLeft > 0, roomsLeft,
    };
  }));
}));
