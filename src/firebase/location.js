// Haversine formula — precise distance in km between two GPS coordinates
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Get user GPS location from browser
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

// Reverse geocode using OpenStreetMap — get area name from coords
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const parts = [
      addr.suburb || addr.neighbourhood || addr.quarter || addr.village || '',
      addr.city || addr.town || addr.county || addr.state_district || '',
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : (addr.state || 'Your location');
  } catch {
    return 'Your location';
  }
}

// Forward geocode — text to coordinates (for manual entry fallback)
export async function forwardGeocode(text) {
  try {
    const query = encodeURIComponent(text + ', India');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&accept-language=en`
    );
    const data = await res.json();
    return data.map(r => ({
      label: r.display_name.split(',').slice(0, 3).join(', '),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
  } catch {
    return [];
  }
}

export const RADIUS_KM = 10;
