import { useState, useEffect, useCallback } from 'react';
import { db, Photo } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PhotoCategory = 'selfie' | 'property' | 'document' | 'other';

const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  selfie: 'Customer Selfie',
  property: 'Property/Location',
  document: 'Documents',
  other: 'Other',
};

export { CATEGORY_LABELS };

export function useVisitPhotos(visitId: string | undefined) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncedPhotos, setSyncedPhotos] = useState<any[]>([]);

  const loadPhotos = useCallback(async () => {
    if (!visitId) return;
    try {
      const local = await db.photos.where('visitId').equals(visitId).toArray();
      setPhotos(local);

      // Also load synced photos from Supabase
      const { data } = await supabase
        .from('visit_photos')
        .select('*')
        .eq('visit_id', visitId)
        .order('captured_at', { ascending: true });
      if (data) setSyncedPhotos(data);
    } catch (err) {
      console.error('[VisitPhotos] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const capturePhoto = useCallback(async (
    file: File,
    category: PhotoCategory,
  ) => {
    if (!visitId) return;

    // Get GPS location
    let latitude: number | undefined;
    let longitude: number | undefined;
    let accuracy: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      accuracy = pos.coords.accuracy;
    } catch {
      // Fallback: no GPS, still save photo
      console.warn('[VisitPhotos] GPS unavailable, saving without geotag');
    }

    const id = crypto.randomUUID();
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    const photo: Photo = {
      id,
      visitId,
      blob,
      category,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date(),
      syncStatus: 'pending',
    };

    await db.photos.add(photo);
    
    // Queue for sync
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'photo',
      entityId: id,
      action: 'create',
      data: { visitId, category },
      priority: 2,
      retryCount: 0,
      maxRetries: 5,
      createdAt: new Date(),
    });

    await loadPhotos();
    toast.success(`${CATEGORY_LABELS[category]} photo captured`);
  }, [visitId, loadPhotos]);

  const deletePhoto = useCallback(async (photoId: string) => {
    await db.photos.delete(photoId);
    await db.syncQueue.where('entityId').equals(photoId).delete();
    await loadPhotos();
    toast.success('Photo removed');
  }, [loadPhotos]);

  const getPhotoUrl = useCallback((photo: Photo) => {
    return URL.createObjectURL(photo.blob);
  }, []);

  // Total count: local pending + synced (avoid double-counting)
  const localPendingIds = new Set(photos.filter(p => p.syncStatus === 'pending').map(p => p.id));
  const totalCount = localPendingIds.size + syncedPhotos.length;

  return {
    photos,
    syncedPhotos,
    loading,
    capturePhoto,
    deletePhoto,
    getPhotoUrl,
    totalCount,
    meetsMinimum: totalCount >= 2,
  };
}
