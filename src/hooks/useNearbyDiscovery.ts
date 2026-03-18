import { useState } from 'react';

interface NearbyBusiness {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
}

export function useNearbyDiscovery() {
  const [businesses, setBusinesses] = useState<NearbyBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discoverNearby = async (
    lat: number,
    lon: number,
    radiusMeters: number = 500
  ): Promise<NearbyBusiness[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Overpass API query for shops, offices, and amenities
      const query = `
        [out:json][timeout:10];
        (
          node["shop"](around:${radiusMeters},${lat},${lon});
          node["office"](around:${radiusMeters},${lat},${lon});
          node["amenity"~"bank|pharmacy|restaurant|cafe|hospital|clinic|fuel"](around:${radiusMeters},${lat},${lon});
          node["craft"](around:${radiusMeters},${lat},${lon});
        );
        out body;
      `.trim();

      const response = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'FieldSync/1.0' } }
      );

      if (!response.ok) {
        throw new Error('Overpass API request failed');
      }

      const data = await response.json();

      const results: NearbyBusiness[] = (data.elements || [])
        .filter((el: any) => el.tags?.name)
        .map((el: any) => ({
          id: el.id,
          name: el.tags.name,
          type: el.tags.shop || el.tags.office || el.tags.amenity || el.tags.craft || 'business',
          lat: el.lat,
          lon: el.lon,
          address: [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', '),
          phone: el.tags.phone || el.tags['contact:phone'] || undefined,
        }));

      setBusinesses(results);
      return results;
    } catch (err: any) {
      const message = err.message || 'Discovery failed';
      setError(message);
      setBusinesses([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { businesses, discoverNearby, isLoading, error };
}
