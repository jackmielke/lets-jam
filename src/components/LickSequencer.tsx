import { useState, useCallback } from "react";
import { Lick } from "@/types/lick";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface LickSequencerProps {
  availableLicks: Lick[];
  onPlaySequence: (licks: Lick[]) => void;
  isPlaying: boolean;
}

export const LickSequencer = ({ availableLicks, onPlaySequence, isPlaying }: LickSequencerProps) => {
  const [sequence, setSequence] = useState<Lick[]>([]);

  const handleAddLick = useCallback((lick: Lick) => {
    setSequence(prev => [...prev, lick]);
    toast.success(`Added ${lick.name} to sequence`);
  }, []);

  const handleRemoveLick = useCallback((index: number) => {
    setSequence(prev => prev.filter((_, i) => i !== index));
    toast.success("Removed from sequence");
  }, []);

  const handleClearSequence = useCallback(() => {
    setSequence([]);
    toast.success("Sequence cleared");
  }, []);

  const handlePlaySequence = useCallback(() => {
    if (sequence.length === 0) {
      toast.error("Add licks to the sequence first");
      return;
    }
    onPlaySequence(sequence);
  }, [sequence, onPlaySequence]);

  return (
    <Card className="p-6 animate-slide-up">
      <h3 className="text-xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
        Lick Sequencer
      </h3>

      <div className="space-y-4">
        {/* Available Licks */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Available Licks</h4>
          <div className="flex flex-wrap gap-2">
            {availableLicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved licks yet</p>
            ) : (
              availableLicks.map((lick) => (
                <Button
                  key={lick.id}
                  onClick={() => handleAddLick(lick)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="w-3 h-3" />
                  {lick.name}
                </Button>
              ))
            )}
          </div>
        </div>

        {/* Sequence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Sequence</h4>
            {sequence.length > 0 && (
              <Button
                onClick={handleClearSequence}
                variant="ghost"
                size="sm"
                className="h-7"
              >
                Clear All
              </Button>
            )}
          </div>

          {sequence.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Add licks from above to create a sequence
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sequence.map((lick, index) => (
                <div
                  key={`${lick.id}-${index}`}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg group"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="flex-1 font-medium">{lick.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {lick.bpm} BPM
                  </span>
                  <Button
                    onClick={() => handleRemoveLick(index)}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Play Button */}
        {sequence.length > 0 && (
          <Button
            onClick={handlePlaySequence}
            disabled={isPlaying}
            className="w-full gap-2"
          >
            <Play className="w-4 h-4" />
            {isPlaying ? "Playing..." : `Play Sequence (${sequence.length} licks)`}
          </Button>
        )}
      </div>
    </Card>
  );
};
