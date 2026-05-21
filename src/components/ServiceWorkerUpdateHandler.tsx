import { useEffect, useRef } from 'react';

export function ServiceWorkerUpdateHandler() {
  const hasHandledUpdate = useRef(false);

  useEffect(() => {
    const handleUpdate = () => {
      if (hasHandledUpdate.current) return;
      hasHandledUpdate.current = true;
      window.location.reload();
    };

    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  return null;
}
