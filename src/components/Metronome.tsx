import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface MetronomeProps {
  isPlaying: boolean;
  currentBeat: number;
  beatsPerBar: number;
  bpm: number;
  onToggle: () => void;
  onBpmChange: (bpm: number) => void;
}

export const Metronome = ({ 
  isPlaying, 
  currentBeat, 
  beatsPerBar, 
  bpm, 
  onToggle,
  onBpmChange 
}: MetronomeProps) => {
  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-xl border border-border animate-slide-up">
      <h3 className="text-lg font-semibold">Metronome</h3>
      
      {/* Beat Indicator */}
      <div className="flex gap-2">
        {Array.from({ length: beatsPerBar }, (_, i) => i + 1).map((beat) => (
          <div
            key={beat}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
              transition-all duration-100
              ${currentBeat === beat && isPlaying
                ? beat === 1 
                  ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                  : 'bg-secondary text-secondary-foreground scale-110 shadow-lg'
                : 'bg-muted text-muted-foreground'
              }
            `}
          >
            {beat}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onToggle}
          size="lg"
          variant={isPlaying ? "destructive" : "default"}
        >
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">BPM:</label>
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => onBpmChange(Number(e.target.value))}
            className="w-16 px-2 py-1 text-center rounded border border-border bg-background"
          />
        </div>
      </div>
    </div>
  );
};
