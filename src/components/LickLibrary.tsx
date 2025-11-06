import { Lick } from "@/types/lick";
import { Card } from "@/components/ui/card";
import { Music, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LickLibraryProps {
  licks: Lick[];
  onDelete: (lickId: string) => void;
  onDemonstrate: (lick: Lick) => void;
}

export const LickLibrary = ({ licks, onDelete, onDemonstrate }: LickLibraryProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Music className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-semibold">Lick Library ({licks.length}/5)</h3>
      </div>
      
      {licks.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No licks saved yet. Start the metronome and play a lick, then click "Save as Lick" to add it to your library.
        </p>
      ) : (
        <div className="space-y-3">
          {licks.map((lick) => (
            <div
              key={lick.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-semibold">{lick.name}</div>
                <div className="text-sm text-muted-foreground">
                  {lick.notes.length} notes • {lick.bpm} BPM
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {lick.notes.map(n => n.noteName).join(" → ")}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDemonstrate(lick)}
                  className="hover:text-primary"
                >
                  <Play className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(lick.id)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
