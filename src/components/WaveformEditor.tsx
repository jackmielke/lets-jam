import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const [zoomLevel, setZoomLevel] = useState(50);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize WaveSurfer
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'hsl(var(--muted-foreground) / 0.8)',
      progressColor: 'hsl(var(--primary))',
      cursorColor: 'hsl(var(--primary))',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height,
      normalize: true,
      backend: 'WebAudio',
      interact: true,
      minPxPerSec: zoomLevel,
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
      console.log('WaveformEditor: Waveform clicked', {
        relativeX,
        duration: ws.getDuration(),
        clickTime
      });
      onCuePointChange(clickTime);
    });

    return () => {
      ws.destroy();
    };
  }, [audioUrl, height]);

  // Update zoom when slider changes (only after audio is ready)
  useEffect(() => {
    if (wavesurferRef.current && isReady) {
      wavesurferRef.current.zoom(zoomLevel);
    }
  }, [zoomLevel, isReady]);

  // Update cue point marker
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return;

    // Get duration directly from wavesurfer to avoid stale state
    const currentDuration = wavesurferRef.current.getDuration();
    if (!currentDuration || currentDuration === 0) {
      console.log('WaveformEditor: Duration not available yet');
      return;
    }

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
    const markerPosition = (cuePoint / currentDuration) * 100;
    
    console.log('WaveformEditor: Rendering marker', {
      cuePoint,
      currentDuration,
      markerPosition: `${markerPosition}%`,
      isReady
    });
    
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
  }, [cuePoint, isReady]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const seekToCuePoint = () => {
    if (wavesurferRef.current) {
      const currentDuration = wavesurferRef.current.getDuration();
      if (currentDuration && currentDuration > 0) {
        console.log('WaveformEditor: Seeking to cue point', {
          cuePoint,
          currentDuration,
          seekRatio: cuePoint / currentDuration
        });
        wavesurferRef.current.seekTo(cuePoint / currentDuration);
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(500, prev + 25));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(10, prev - 25));
  };

  const handleResetZoom = () => {
    setZoomLevel(50);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative bg-background border border-border rounded-lg overflow-hidden overflow-x-auto" style={{ height: height + 'px' }}>
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            disabled={!isReady || zoomLevel <= 10}
            variant="outline"
            size="sm"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 flex items-center gap-3">
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => setZoomLevel(value[0])}
              min={10}
              max={500}
              step={5}
              disabled={!isReady}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground min-w-[80px]">
              Zoom: {zoomLevel}px/s
            </span>
          </div>

          <Button
            onClick={handleZoomIn}
            disabled={!isReady || zoomLevel >= 500}
            variant="outline"
            size="sm"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleResetZoom}
            disabled={!isReady}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Click anywhere on the waveform to set the cue point. Use zoom controls for precise placement.
      </p>
    </div>
  );
};
