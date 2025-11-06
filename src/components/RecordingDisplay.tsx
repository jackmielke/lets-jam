import { RecordedNote } from "@/types/recording";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface RecordingDisplayProps {
  notes: RecordedNote[];
  isRecording: boolean;
}

const accuracyColors = {
  perfect: 'bg-green-500',
  good: 'bg-lime-500',
  ok: 'bg-yellow-500',
  poor: 'bg-red-500'
};

const getSubdivisionName = (subdivision: number): string => {
  if (subdivision < 0.125) return 'on beat';
  if (subdivision < 0.375) return '16th after';
  if (subdivision < 0.625) return '8th after';
  if (subdivision < 0.875) return '16th before next';
  return 'near next beat';
};

export const RecordingDisplay = ({ notes, isRecording }: RecordingDisplayProps) => {
  return (
    <div className="p-6 bg-card rounded-xl border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recording</h3>
        {isRecording && (
          <Badge variant="destructive" className="animate-pulse">
            ● REC
          </Badge>
        )}
      </div>

      <ScrollArea className="h-48 w-full rounded-md border p-4">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Start the metronome and play notes to record
          </p>
        ) : (
          <div className="space-y-2">
            {notes.slice().reverse().map((note, idx) => (
              <div 
                key={notes.length - idx}
                className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
              >
                <span className="font-semibold w-12">{note.noteName}</span>
                <span className="text-muted-foreground text-xs">
                  Beat {note.beatNumber} {getSubdivisionName(note.subdivision)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {note.offsetMs.toFixed(0)}ms off
                  </span>
                  <div 
                    className={`w-2 h-2 rounded-full ${accuracyColors[note.accuracy]}`}
                    title={note.accuracy}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {notes.length > 0 && (
        <div className="mt-4 flex gap-2">
          <div className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Perfect (&lt;30ms)</span>
          </div>
          <div className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-lime-500" />
            <span>Good (&lt;50ms)</span>
          </div>
          <div className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>OK (&lt;100ms)</span>
          </div>
          <div className="text-xs flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Poor</span>
          </div>
        </div>
      )}
    </div>
  );
};
