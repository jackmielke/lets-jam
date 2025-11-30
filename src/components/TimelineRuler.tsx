import { useEffect, useRef } from 'react';

interface TimelineRulerProps {
  duration: number;
  pixelsPerSecond: number;
  currentTime: number;
}

export const TimelineRuler = ({ duration, pixelsPerSecond, currentTime }: TimelineRulerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = duration * pixelsPerSecond;
    canvas.width = width;
    canvas.height = 40;

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--card))';
    ctx.fillRect(0, 0, width, canvas.height);

    // Draw ruler marks
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px sans-serif';

    for (let sec = 0; sec <= duration; sec++) {
      const x = sec * pixelsPerSecond;
      
      // Major marks every second
      if (sec % 1 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, 40);
        ctx.stroke();
        
        // Time label
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, x + 2, 15);
      }
      
      // Minor marks every 0.5 seconds
      if (sec % 0.5 === 0 && sec % 1 !== 0) {
        ctx.beginPath();
        ctx.moveTo(x, 30);
        ctx.lineTo(x, 40);
        ctx.stroke();
      }
    }

    // Draw playhead
    const playheadX = currentTime * pixelsPerSecond;
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, 40);
    ctx.stroke();
  }, [duration, pixelsPerSecond, currentTime]);

  return (
    <div className="border-b border-border bg-card">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
};
