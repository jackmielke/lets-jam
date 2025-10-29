import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onClear: () => void;
  tempo: number;
  onTempoChange: (tempo: number) => void;
}

export const Controls = ({ isPlaying, onPlayPause, onClear, tempo, onTempoChange }: ControlsProps) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-card rounded-xl border border-border animate-slide-up">
      <Button
        onClick={onPlayPause}
        size="lg"
        className="bg-gradient-primary hover:brightness-110 transition-all"
      >
        {isPlaying ? (
          <>
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Play
          </>
        )}
      </Button>
      
      <Button
        onClick={onClear}
        variant="outline"
        size="lg"
        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <RotateCcw className="mr-2 h-5 w-5" />
        Clear
      </Button>

      <div className="flex items-center gap-3 ml-4">
        <label className="text-sm font-medium text-foreground">BPM:</label>
        <input
          type="range"
          min="60"
          max="180"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
          className="w-32 accent-primary"
        />
        <span className="text-lg font-bold text-primary w-12">{tempo}</span>
      </div>
    </div>
  );
};
