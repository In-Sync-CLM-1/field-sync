import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerUpdateHandler() {
  const hasShownUpdate = useRef(false);

  useEffect(() => {
    const handleUpdate = () => {
      // Only show once per session
      if (hasShownUpdate.current) return;
      hasShownUpdate.current = true;

      toast('Update available', {
        description: 'A new version is ready. Reload to update.',
        duration: Infinity,
        action: {
          label: 'Reload',
          onClick: () => window.location.reload(),
        },
      });
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  return null;
}
