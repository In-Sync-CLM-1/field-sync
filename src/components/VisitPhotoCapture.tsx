import { useRef, useState, useEffect } from 'react';
import { useVisitPhotos, PhotoCategory, CATEGORY_LABELS } from '@/hooks/useVisitPhotos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Trash2, MapPin, Clock, CheckCircle2, AlertCircle, Image } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface VisitPhotoCaptureProps {
  visitId: string;
  isActive: boolean;
  onPhotoCountChange?: (count: number, meetsMinimum: boolean) => void;
}

export function VisitPhotoCapture({ visitId, isActive, onPhotoCountChange }: VisitPhotoCaptureProps) {
  const { photos, syncedPhotos, loading, capturePhoto, deletePhoto, getPhotoUrl, totalCount, meetsMinimum } = useVisitPhotos(visitId);
  const [category, setCategory] = useState<PhotoCategory>('selfie');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    onPhotoCountChange?.(totalCount, meetsMinimum);
  }, [totalCount, meetsMinimum, onPhotoCountChange]);

  // Generate object URLs for local photos
  useEffect(() => {
    const urls: Record<string, string> = {};
    photos.forEach(p => {
      urls[p.id] = URL.createObjectURL(p.blob);
    });
    setLocalUrls(urls);
    return () => {
      Object.values(urls).forEach(URL.revokeObjectURL);
    };
  }, [photos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await capturePhoto(file, category);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStorageUrl = (path: string) => {
    const { data } = supabase.storage.from('visit-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Visit Photos
          </CardTitle>
          <Badge variant={meetsMinimum ? 'default' : 'destructive'} className="text-xs">
            {totalCount}/2 required
          </Badge>
        </div>
        {!meetsMinimum && (
          <p className="text-xs text-destructive flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            Please capture at least 2 photos before completing
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capture Controls */}
        {isActive && (
          <div className="flex gap-2">
            <Select value={category} onValueChange={(v) => setCategory(v as PhotoCategory)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORY_LABELS) as [PhotoCategory, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInputRef.current?.click()} size="default" className="gap-2">
              <Camera className="h-4 w-4" />
              Capture
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Photo Grid */}
        {(photos.length > 0 || syncedPhotos.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Local pending photos */}
            {photos.filter(p => p.syncStatus === 'pending').map(photo => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border bg-muted">
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={localUrls[photo.id]}
                      alt={CATEGORY_LABELS[photo.category]}
                      className="w-full h-28 object-cover cursor-pointer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-lg p-1">
                    <img src={localUrls[photo.id]} alt="" className="w-full rounded" />
                  </DialogContent>
                </Dialog>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {CATEGORY_LABELS[photo.category]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 text-amber-300 border-amber-300">
                      Pending sync
                    </Badge>
                  </div>
                  {photo.latitude && (
                    <div className="flex items-center gap-1 opacity-80">
                      <MapPin className="h-2.5 w-2.5" />
                      {photo.latitude.toFixed(4)}, {photo.longitude?.toFixed(4)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 opacity-80">
                    <Clock className="h-2.5 w-2.5" />
                    {format(photo.timestamp, 'p')}
                  </div>
                </div>
                {isActive && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deletePhoto(photo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {/* Synced photos from cloud */}
            {syncedPhotos.map(photo => (
              <div key={photo.id} className="relative rounded-lg overflow-hidden border bg-muted">
                <Dialog>
                  <DialogTrigger asChild>
                    <img
                      src={getStorageUrl(photo.storage_path)}
                      alt={CATEGORY_LABELS[photo.category as PhotoCategory] || photo.category}
                      className="w-full h-28 object-cover cursor-pointer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-lg p-1">
                    <img src={getStorageUrl(photo.storage_path)} alt="" className="w-full rounded" />
                  </DialogContent>
                </Dialog>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1.5 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      {CATEGORY_LABELS[photo.category as PhotoCategory] || photo.category}
                    </Badge>
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  </div>
                  {photo.latitude && (
                    <div className="flex items-center gap-1 opacity-80">
                      <MapPin className="h-2.5 w-2.5" />
                      {Number(photo.latitude).toFixed(4)}, {Number(photo.longitude).toFixed(4)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 opacity-80">
                    <Clock className="h-2.5 w-2.5" />
                    {format(new Date(photo.captured_at), 'p')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {photos.length === 0 && syncedPhotos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Image className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No photos captured yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
