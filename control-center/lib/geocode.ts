/**
 * Geocoding service using Nominatim (OpenStreetMap)
 * Rate-limited to 1 request per second per Nominatim policy
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  raw: any;
}

/**
 * Geocode an address using Nominatim
 * @param address The address to geocode
 * @returns Latitude, longitude, city, state, and raw response
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim().length === 0) {
    throw new Error('Address is required for geocoding');
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FAXAS Property Management System/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      throw new Error(`No geocoding results found for address: ${address}`);
    }

    const firstResult = results[0];
    const addressDetails = firstResult.address || {};

    return {
      lat: parseFloat(firstResult.lat),
      lng: parseFloat(firstResult.lon),
      city: addressDetails.city || addressDetails.town || addressDetails.village,
      state: addressDetails.state,
      raw: firstResult
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
    throw new Error('Unknown geocoding error occurred');
  }
}