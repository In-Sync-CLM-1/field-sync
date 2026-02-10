import { useState, useMemo, useEffect } from 'react';
import { Visit } from '@/hooks/useVisits';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Route, Loader2 } from 'lucide-react';

// Haversine formula
const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDist = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

interface Props {
  visits: Visit[];
}

interface Stop {
  visit: Visit;
  lat: number;
  lng: number;
  distFromPrev: number;
}

export function RouteOptimizer({ visits }: Props) {
  const [agentLocation, setAgentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAgentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const visitsWithLocation = useMemo(
    () =>
      visits.filter(
        (v) => v.lead?.latitude && v.lead?.longitude && v.status === 'scheduled'
      ),
    [visits]
  );

  const optimizedRoute = useMemo((): Stop[] => {
    if (visitsWithLocation.length === 0) return [];

    const remaining = [...visitsWithLocation];
    const route: Stop[] = [];
    let currentLat = agentLocation?.lat ?? 0;
    let currentLng = agentLocation?.lng ?? 0;

    while (remaining.length > 0) {
      let closestIdx = 0;
      let closestDist = Infinity;

      remaining.forEach((v, i) => {
        const d = haversine(currentLat, currentLng, Number(v.lead!.latitude), Number(v.lead!.longitude));
        if (d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      });

      const next = remaining.splice(closestIdx, 1)[0];
      route.push({
        visit: next,
        lat: Number(next.lead!.latitude),
        lng: Number(next.lead!.longitude),
        distFromPrev: closestDist,
      });
      currentLat = Number(next.lead!.latitude);
      currentLng = Number(next.lead!.longitude);
    }

    return route;
  }, [visitsWithLocation, agentLocation]);

  const totalDistance = useMemo(() => optimizedRoute.reduce((sum, s) => sum + s.distFromPrev, 0), [optimizedRoute]);

  const openInGoogleMaps = () => {
    if (optimizedRoute.length === 0) return;
    const origin = agentLocation
      ? `${agentLocation.lat},${agentLocation.lng}`
      : `${optimizedRoute[0].lat},${optimizedRoute[0].lng}`;
    const destination = `${optimizedRoute[optimizedRoute.length - 1].lat},${optimizedRoute[optimizedRoute.length - 1].lng}`;
    const waypoints = optimizedRoute
      .slice(0, -1)
      .map((s) => `${s.lat},${s.lng}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Getting your location for route optimization...
        </CardContent>
      </Card>
    );
  }

  if (visitsWithLocation.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          No scheduled visits with locations to optimize.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4" />
            Optimized Route
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {formatDist(totalDistance)} total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {agentLocation && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b">
            <MapPin className="h-3 w-3 text-primary" />
            <span>Your location (start)</span>
          </div>
        )}
        {optimizedRoute.map((stop, idx) => (
          <div key={stop.visit.id} className="flex items-center gap-2 text-sm">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate text-xs">{stop.visit.lead?.name || 'Unknown'}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatDist(stop.distFromPrev)}</span>
          </div>
        ))}
        <Button size="sm" className="w-full mt-2 gap-2" onClick={openInGoogleMaps}>
          <Navigation className="h-4 w-4" />
          Open in Google Maps
        </Button>
      </CardContent>
    </Card>
  );
}
