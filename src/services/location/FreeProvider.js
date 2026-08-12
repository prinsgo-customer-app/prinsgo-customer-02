import * as Location from 'expo-location';
import axios from 'axios';
import LocationProvider from './LocationProvider';

// Popular Indian Cities sample coords to fallback or boost search if GPS is off
export const POPULAR_CITIES = [
  { name: 'Pune', lat: 18.5204, lng: 73.8567, state: 'Maharashtra' },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, state: 'Telangana' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, state: 'Madhya Pradesh' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, state: 'Madhya Pradesh' },
  { name: 'Jabalpur', lat: 23.1815, lng: 79.9864, state: 'Madhya Pradesh' },
  { name: 'Umaria', lat: 23.5262, lng: 80.8354, state: 'Madhya Pradesh' },
];

export default class FreeProvider extends LocationProvider {
  constructor() {
    super();
    // Cache for geocoding & search requests to stay rate-limit compliant
    this.searchCache = new Map();
    this.reverseCache = new Map();
  }

  async getCurrentLocation() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };

      // Attempt reverse geocoding to attach address
      try {
        const rev = await this.reverseGeocode(coords.lat, coords.lng);
        coords.address = rev.address;
      } catch (e) {
        coords.address = 'Current Location';
      }
      return coords;
    } catch (err) {
      // Default to Pune center if device location fails entirely
      return {
        lat: 18.5204,
        lng: 73.8567,
        address: 'Pune, Maharashtra, India',
      };
    }
  }

  async search(query, lat, lng) {
    if (!query || query.trim().length < 2) return [];

    const cacheKey = `${query.trim().toLowerCase()}_${lat || 0}_${lng || 0}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    try {
      // First try native Expo geocoding (super fast, OS-backed, 100% free)
      const results = await Location.geocodeAsync(query);
      if (results && results.length > 0) {
        const mapped = results.map((item, index) => {
          const desc = `${query} (Area ${index + 1})`;
          return {
            placeId: `free_native_${index}_${item.latitude}_${item.longitude}`,
            description: desc,
            address: query,
            lat: item.latitude,
            lng: item.longitude,
          };
        });
        this.searchCache.set(cacheKey, mapped);
        return mapped;
      }
    } catch (e) {
      // ignore & fall back to Osm Nominatim
    }

    try {
      // Fallback to OpenStreetMap Nominatim
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          addressdetails: 1,
          countrycodes: 'in', // Boost India results
        },
        headers: {
          'User-Agent': 'PrinsGoCustomerApp/1.0.0 (support@prinsgo.com)',
        },
        timeout: 5000,
      });

      if (response.data && Array.isArray(response.data)) {
        const mapped = response.data.map((item) => ({
          placeId: `osm_${item.place_id}`,
          description: item.display_name,
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        this.searchCache.set(cacheKey, mapped);
        return mapped;
      }
    } catch (err) {
      // If offline/rate-limited, fallback to popular cities that contain the query
      const lowerQuery = query.toLowerCase();
      const matchedPopular = POPULAR_CITIES.filter(
        (c) => c.name.toLowerCase().includes(lowerQuery) || c.state.toLowerCase().includes(lowerQuery)
      ).map((c, index) => ({
        placeId: `free_pop_${index}_${c.lat}_${c.lng}`,
        description: `${c.name}, ${c.state}, India`,
        address: `${c.name}, ${c.state}, India`,
        lat: c.lat,
        lng: c.lng,
      }));

      if (matchedPopular.length > 0) {
        return matchedPopular;
      }
    }

    return [];
  }

  async reverseGeocode(lat, lng) {
    const cacheKey = `${lat}_${lng}`;
    if (this.reverseCache.has(cacheKey)) {
      return this.reverseCache.get(cacheKey);
    }

    try {
      // Native reverse geocode
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const item = results[0];
        const parts = [
          item.name,
          item.street,
          item.district,
          item.city,
          item.region,
          item.postalCode,
          item.country,
        ].filter(Boolean);
        const address = parts.join(', ') || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
        const res = { address, lat, lng };
        this.reverseCache.set(cacheKey, res);
        return res;
      }
    } catch (e) {
      // ignore
    }

    try {
      // OSM Nominatim Reverse Geocode fallback
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'PrinsGoCustomerApp/1.0.0 (support@prinsgo.com)',
        },
        timeout: 5000,
      });

      if (response.data && response.data.display_name) {
        const res = {
          address: response.data.display_name,
          lat,
          lng,
        };
        this.reverseCache.set(cacheKey, res);
        return res;
      }
    } catch (err) {
      // ignore
    }

    // Default placeholder
    return {
      address: `Location near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    };
  }

  async getRoute(pickup, drop) {
    const pLat = pickup.lat || pickup.latitude;
    const pLng = pickup.lng || pickup.longitude;
    const dLat = drop.lat || drop.latitude;
    const dLng = drop.lng || drop.longitude;

    try {
      // OSM OSRM public routing API (100% free, OSM compatible)
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
          },
          timeout: 5000,
        }
      );

      if (response.data?.routes?.[0]?.geometry?.coordinates) {
        return response.data.routes[0].geometry.coordinates.map((coord) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
      }
    } catch (err) {
      // ignore and do interpolations fallback
    }

    // High quality interpolated curved line route (makes the map route visualization look premium!)
    const steps = 15;
    const path = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation
      let lat = pLat + (dLat - pLat) * t;
      let lng = pLng + (dLng - pLng) * t;

      // Add a slight arc/curve to make the fallback line look like a realistic road path
      const arcFactor = Math.sin(t * Math.PI) * 0.005;
      lat += arcFactor;
      lng -= arcFactor;

      path.push({ latitude: lat, longitude: lng });
    }
    return path;
  }

  async getDistance(pickup, drop) {
    const pLat = pickup.lat || pickup.latitude;
    const pLng = pickup.lng || pickup.longitude;
    const dLat = drop.lat || drop.latitude;
    const dLng = drop.lng || drop.longitude;

    try {
      // Try OSRM routing first for real distance
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}`,
        { timeout: 5000 }
      );

      if (response.data?.routes?.[0]) {
        const route = response.data.routes[0];
        return {
          distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
          durationMin: Math.max(1, Math.round(route.duration / 60)),
        };
      }
    } catch (err) {
      // ignore
    }

    // Great Haversine fallback formula with 1.3x routing coefficient
    const R = 6371; // Radius of earth in km
    const dLatRad = ((dLat - pLat) * Math.PI) / 180;
    const dLonRad = ((dLng - pLng) * Math.PI) / 180;
    const a =
      Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
      Math.cos((pLat * Math.PI) / 180) *
        Math.cos((dLat * Math.PI) / 180) *
        Math.sin(dLonRad / 2) *
        Math.sin(dLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;
    const roadDist = straightDist * 1.3; // estimate road detours

    return {
      distanceKm: parseFloat(roadDist.toFixed(1)),
      durationMin: Math.max(1, Math.round(roadDist * 2)), // 2 mins per km avg
    };
  }

  async getDetails(placeId) {
    if (placeId.startsWith('osm_')) {
      const osmId = placeId.replace('osm_', '');
      try {
        // Query OSM details
        const response = await axios.get('https://nominatim.openstreetmap.org/details', {
          params: {
            osmtype: 'W',
            osmid: osmId,
            format: 'json',
          },
          headers: {
            'User-Agent': 'PrinsGoCustomerApp/1.0.0 (support@prinsgo.com)',
          },
          timeout: 5000,
        });
        if (response.data) {
          return {
            address: response.data.localname || response.data.names?.name || 'OSM Place',
            lat: parseFloat(response.data.centroid?.coordinates?.[1]),
            lng: parseFloat(response.data.centroid?.coordinates?.[0]),
          };
        }
      } catch (err) {
        // ignore
      }
    }

    // Native decode pattern (free_native_index_lat_lng)
    if (placeId.startsWith('free_native_') || placeId.startsWith('free_pop_')) {
      const parts = placeId.split('_');
      const lat = parseFloat(parts[parts.length - 2]);
      const lng = parseFloat(parts[parts.length - 1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        try {
          const rev = await this.reverseGeocode(lat, lng);
          return {
            address: rev.address,
            lat,
            lng,
          };
        } catch (e) {
          return { address: 'Selected Place', lat, lng };
        }
      }
    }

    // If matches nothing, search POPULAR_CITIES or return Pune
    return {
      address: 'Pune Center, Maharashtra, India',
      lat: 18.5204,
      lng: 73.8567,
    };
  }
}
