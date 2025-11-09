import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface WaveformEditorProps {
  audioUrl: string;
  cuePoint: number;
  onCuePointChange: (seconds: number) => void;
  height?: number;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  audioUrl,
  cuePoint,
  onCuePointChange,
  height = 200
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(var(--muted-foreground) / 0.3)',
      progressColor: 'hsl(var(--primary))',
      cursorColor: 'hsl(var(--primary))',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
    });

    wavesurferRef.current = ws;

    // Load audio
    ws.load(audioUrl);

    // Event listeners
    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    
    ws.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    ws.on('click', (relativeX) => {
      const clickTime = relativeX * ws.getDuration();
      onCuePointChange(clickTime);
    });

    return () => {
      ws.destroy();
    };
  }, [audioUrl, height]);

  // Update cue point marker
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;

    // We'll draw the cue point marker using a canvas overlay
    const container = containerRef.current;
    if (!container) return;

    // Remove existing marker if any
    const existingMarker = container.querySelector('.cue-point-marker');
    if (existingMarker) {
      existingMarker.remove();
    }

    // Create new marker
    const marker = document.createElement('div');
    marker.className = 'cue-point-marker';
    const markerPosition = (cuePoint / duration) * 100;
    
    marker.style.cssText = `
      position: absolute;
      top: 0;
      left: ${markerPosition}%;
      width: 2px;
      height: 100%;
      background-color: hsl(var(--destructive));
      pointer-events: none;
      z-index: 10;
      box-shadow: 0 0 8px hsl(var(--destructive) / 0.5);
    `;

    // Add label
    const label = document.createElement('div');
    label.textContent = 'CUE';
    label.style.cssText = `
      position: absolute;
      top: 4px;
      left: 4px;
      background: hsl(var(--destructive));
      color: hsl(var(--destructive-foreground));
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      pointer-events: none;
    `;
    marker.appendChild(label);

    container.appendChild(marker);
  }, [cuePoint, isReady, duration]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const seekToCuePoint = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.seekTo(cuePoint / duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-2">
      <div className="relative bg-background border border-border rounded-lg overflow-hidden" style={{ height: height + 'px' }}>
        <div ref={containerRef} className="w-full h-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <p className="text-sm text-muted-foreground">Loading waveform...</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={togglePlayPause}
          disabled={!isReady}
          variant="outline"
          size="sm"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          onClick={seekToCuePoint}
          disabled={!isReady}
          variant="outline"
          size="sm"
        >
          Jump to Cue
        </Button>

        <div className="flex-1 text-sm text-muted-foreground text-right space-x-4">
          <span>Current: {formatTime(currentTime)}</span>
          <span>Cue: {formatTime(cuePoint)}</span>
          <span>Duration: {formatTime(duration)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click anywhere on the waveform to set the cue point
      </p>
    </div>
  );
};
