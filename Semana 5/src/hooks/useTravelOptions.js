import { useCallback } from 'react';
import { useGraphQLResource } from './useGraphQLResource.js';
import { validateTravelOptions } from '../lib/travel-options.js';

/** Se consultan ambos recursos en una sola solicitud GraphQL y se filtran por destino. */
export const TRAVEL_OPTIONS_QUERY = `
  query TravelOptions($destinationId: ID!) {
    flights(destinationId: $destinationId) {
      id destinationId airline flightNumber origin arrival departureDate returnDate
      price currency available seatsLeft
    }
    hotels(destinationId: $destinationId) {
      id destinationId name location checkIn checkOut nightlyPrice currency
      amenities available roomsLeft
    }
  }
`;

export function useTravelOptions(destinationId) {
  const validate = useCallback((data) => validateTravelOptions(data, destinationId), [destinationId]);
  return useGraphQLResource(TRAVEL_OPTIONS_QUERY, { destinationId }, validate, Boolean(destinationId));
}
