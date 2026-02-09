import { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Search, X, MapPinPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNearbyPlaces, PLACE_TYPES, RADIUS_OPTIONS, NearbyPlace } from '@/hooks/useNearbyPlaces';
import { useLeads } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface NearbyPlacesPanelProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
}

export function NearbyPlacesPanel({ map, mapLoaded }: NearbyPlacesPanelProps) {
  const { places, loading, searchNearby, clearPlaces } = useNearbyPlaces();
  const { addLead } = useLeads();
  const { user, currentOrganization } = useAuthStore();
  const [radius, setRadius] = useState(5000);
  const [placeType, setPlaceType] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [markersRef] = useState<{ current: mapboxgl.Marker[] }>({ current: [] });
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
  }, [markersRef]);

  const handleSearch = async () => {
    if (!map) return;
    const center = map.getCenter();
    const types = placeType ? [placeType] : [];
    await searchNearby(center.lat, center.lng, radius, types);
  };

  const handleAddAsProspect = async (place: NearbyPlace) => {
    if (!currentOrganization || !user) {
      toast.error('Please select an organization first');
      return;
    }
    setAddingPlaceId(place.id);
    try {
      await addLead({
        name: place.displayName,
        organizationId: currentOrganization.id,
        villageCity: place.formattedAddress,
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        mobileNo: place.phoneNumber || undefined,
        leadSource: 'Google Places',
        status: 'lead',
        createdBy: user.id,
        assignedUserId: user.id,
      });
      toast.success(`Added "${place.displayName}" as prospect`);
    } catch {
      // error handled by addLead
    } finally {
      setAddingPlaceId(null);
    }
  };

  // Render markers on map when places change
  const renderMarkers = useCallback(() => {
    if (!map || !mapLoaded) return;
    clearMarkers();

    places.forEach(place => {
      const el = document.createElement('div');
      el.className = 'nearby-place-marker';
      el.style.cssText = 'width:28px;height:28px;background:#8b5cf6;border:2.5px solid #fff;border-radius:6px;transform:rotate(45deg);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3);';

      const popup = new mapboxgl.Popup({ offset: 20, maxWidth: '260px' }).setHTML(`
        <div style="padding:8px;">
          <div style="font-size:10px;color:#8b5cf6;font-weight:600;margin-bottom:2px;">${place.primaryType?.replace(/_/g, ' ').toUpperCase() || 'PLACE'}</div>
          <h3 style="font-weight:600;margin-bottom:4px;color:#1f2937;">${place.displayName}</h3>
          <p style="font-size:13px;color:#6b7280;margin-bottom:6px;">${place.formattedAddress}</p>
          ${place.phoneNumber ? `<p style="font-size:13px;color:#6b7280;margin-bottom:6px;">📞 ${place.phoneNumber}</p>` : ''}
          <button id="add-prospect-${place.id}" style="width:100%;padding:6px;background:#8b5cf6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">
            + Add as Prospect
          </button>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.location.longitude, place.location.latitude])
        .setPopup(popup)
        .addTo(map);

      popup.on('open', () => {
        const btn = document.getElementById(`add-prospect-${place.id}`);
        btn?.addEventListener('click', () => handleAddAsProspect(place));
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if places exist
    if (places.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach(p => bounds.extend([p.location.longitude, p.location.latitude]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 15 });
    }
  }, [map, mapLoaded, places, clearMarkers, markersRef]);

  // Trigger marker rendering when places update
  if (places.length > 0 && map && mapLoaded) {
    // Use a microtask to avoid calling during render
    queueMicrotask(renderMarkers);
  }

  const handleClear = () => {
    clearPlaces();
    clearMarkers();
  };

  if (!expanded) {
    return (
      <Button
        size="sm"
        onClick={() => setExpanded(true)}
        className="absolute bottom-4 left-4 z-10 bg-violet-600 hover:bg-violet-700 text-white shadow-lg gap-1.5"
      >
        <Search className="h-4 w-4" />
        Discover Nearby
      </Button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-background border rounded-lg shadow-lg p-3 w-72 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <MapPinPlus className="h-4 w-4 text-violet-600" />
          Discover Nearby
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2 mb-3">
        <Select value={placeType} onValueChange={setPlaceType}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All business types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {PLACE_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(radius)} onValueChange={v => setRadius(Number(v))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map(r => (
              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1.5">
          <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Search className="h-3.5 w-3.5 mr-1" />}
            Search
          </Button>
          {places.length > 0 && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {places.length > 0 && (
        <div className="border-t pt-2">
          <p className="text-[10px] text-muted-foreground mb-1.5">{places.length} places found</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {places.map(place => (
              <div key={place.id} className="text-xs p-2 rounded border bg-muted/50 flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="font-medium truncate">{place.displayName}</p>
                  <p className="text-muted-foreground text-[10px] truncate">{place.formattedAddress}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0 text-violet-600 hover:text-violet-700"
                  onClick={() => handleAddAsProspect(place)}
                  disabled={addingPlaceId === place.id}
                  title="Add as Prospect"
                >
                  {addingPlaceId === place.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPinPlus className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
