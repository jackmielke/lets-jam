import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Disc3 } from "lucide-react";
import { toast } from "sonner";

interface DJDeckProps {
  sampleUrl?: string;
  deckLabel: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  volume: number;
  onVolumeChange: (value: number) => void;
  tempo: number;
  onTempoChange: (value: number) => void;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  onEqChange: (type: 'low' | 'mid' | 'high', value: number) => void;
}

export const DJDeck = ({
  sampleUrl,
  deckLabel,
  isPlaying,
  onPlayPause,
  volume,
  onVolumeChange,
  tempo,
  onTempoChange,
  eqLow,
  eqMid,
  eqHigh,
  onEqChange,
}: DJDeckProps) => {
  const [rotation, setRotation] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setRotation(prev => (prev + 2) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && sampleUrl) {
      audioRef.current.playbackRate = tempo / 100;
      audioRef.current.volume = volume / 100;
    }
  }, [tempo, volume, sampleUrl]);

  const handleCue = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      toast.success("Cued to start");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-background via-background to-muted border-primary/20">
      <div className="space-y-4">
        {/* Deck Label */}
        <h3 className="text-xl font-bold text-center text-primary">{deckLabel}</h3>

        {/* Turntable Platter */}
        <div className="relative w-48 h-48 mx-auto">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-muted to-background border-4 border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
            <div 
              className="absolute inset-4 rounded-full bg-gradient-to-br from-background to-muted border-2 border-primary/50 transition-transform duration-100"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <Disc3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
              <div className="absolute top-1/2 left-1/2 w-2 h-16 bg-primary/80 origin-bottom -translate-x-1/2 -translate-y-full" />
            </div>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex justify-center gap-2">
          <Button
            onClick={handleCue}
            size="sm"
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            onClick={onPlayPause}
            size="lg"
            className="bg-gradient-primary hover:brightness-110"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Tempo Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>TEMPO</span>
            <span className="text-primary font-mono">{tempo}%</span>
          </div>
          <Slider
            value={[tempo]}
            onValueChange={(vals) => onTempoChange(vals[0])}
            min={50}
            max={150}
            step={1}
            className="cursor-pointer"
          />
        </div>

        {/* EQ Section */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block text-center">LOW</label>
            <div className="h-32 flex flex-col-reverse items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={eqLow}
                onChange={(e) => onEqChange('low', Number(e.target.value))}
                className="h-full accent-primary cursor-pointer appearance-none [writing-mode:vertical-lr] direction-rtl"
              />
            </div>
            <div className="text-xs text-center text-primary font-mono">{eqLow}%</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block text-center">MID</label>
            <div className="h-32 flex flex-col-reverse items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={eqMid}
                onChange={(e) => onEqChange('mid', Number(e.target.value))}
                className="h-full accent-primary cursor-pointer appearance-none [writing-mode:vertical-lr] direction-rtl"
              />
            </div>
            <div className="text-xs text-center text-primary font-mono">{eqMid}%</div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block text-center">HIGH</label>
            <div className="h-32 flex flex-col-reverse items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={eqHigh}
                onChange={(e) => onEqChange('high', Number(e.target.value))}
                className="h-full accent-primary cursor-pointer appearance-none [writing-mode:vertical-lr] direction-rtl"
              />
            </div>
            <div className="text-xs text-center text-primary font-mono">{eqHigh}%</div>
          </div>
        </div>

        {/* Volume Fader */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>VOLUME</span>
            <span className="text-primary font-mono">{volume}%</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={(vals) => onVolumeChange(vals[0])}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        {sampleUrl && (
          <audio ref={audioRef} src={sampleUrl} loop />
        )}
      </div>
    </Card>
  );
};
