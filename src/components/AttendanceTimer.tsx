import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface AttendanceTimerProps {
  punchInTime: string;
}

export function AttendanceTimer({ punchInTime }: AttendanceTimerProps) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const start = new Date(punchInTime).getTime();

    const update = () => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [punchInTime]);

  return (
    <div className="flex items-center gap-2 text-2xl font-mono font-bold text-primary">
      <Clock className="h-6 w-6" />
      <span>{elapsed}</span>
    </div>
  );
}
