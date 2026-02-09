import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NearbyPlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  primaryType: string;
  phoneNumber: string;
}

export const PLACE_TYPES = [
  { value: 'insurance_agency', label: 'Insurance Agency' },
  { value: 'bank', label: 'Bank' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'school', label: 'School' },
  { value: 'shopping_mall', label: 'Shopping Mall' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'store', label: 'Store' },
  { value: 'real_estate_agency', label: 'Real Estate' },
];

export const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
];

export function useNearbyPlaces() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);

  const searchNearby = async (
    latitude: number,
    longitude: number,
    radius: number,
    includedTypes: string[]
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nearby-places', {
        body: { latitude, longitude, radius, includedTypes },
      });

      if (error) throw error;

      setPlaces(data.places || []);
      if ((data.places || []).length === 0) {
        toast.info('No places found in this area');
      }
    } catch (err: unknown) {
      console.error('Nearby search error:', err);
      toast.error('Failed to search nearby places');
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const clearPlaces = () => setPlaces([]);

  return { places, loading, searchNearby, clearPlaces };
}
