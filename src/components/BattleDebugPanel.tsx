import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { RecordedNote } from "@/types/recording";
import { Lick } from "@/types/lick";

interface BattleDebugPanelProps {
  gameState: string;
  currentBar: number;
  recordedNotes: RecordedNote[];
  licks: Lick[];
  timingTolerance: number;
  turnPointsEarned: number;
  totalScore: number;
  isRecording: boolean;
}

export const BattleDebugPanel = ({
  gameState,
  currentBar,
  recordedNotes,
  licks,
  timingTolerance,
  turnPointsEarned,
  totalScore,
  isRecording
}: BattleDebugPanelProps) => {
  return (
    <Card className="p-4 bg-muted/50 border-dashed space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-muted-foreground">Battle Debug Panel</h3>
        {isRecording && (
          <Badge variant="destructive" className="animate-pulse">
            REC
          </Badge>
        )}
      </div>

      {/* Turn State */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Game State:</span>
          <span className="ml-2 font-mono font-bold">{gameState}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Bar:</span>
          <span className="ml-2 font-mono font-bold">{currentBar}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Turn Points:</span>
          <span className="ml-2 font-mono font-bold text-primary">+{turnPointsEarned}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Score:</span>
          <span className="ml-2 font-mono font-bold">{totalScore}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tolerance:</span>
          <span className="ml-2 font-mono">{timingTolerance}ms</span>
        </div>
        <div>
          <span className="text-muted-foreground">Available Licks:</span>
          <span className="ml-2 font-mono">{licks.length}</span>
        </div>
      </div>

      {/* Notes This Turn */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-muted-foreground">
          Notes Played This Turn: {recordedNotes.length}
        </div>
        {recordedNotes.length > 0 ? (
          <div className="max-h-32 overflow-y-auto space-y-1 bg-background/50 p-2 rounded border">
            {recordedNotes.slice(-10).map((note, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono">
                <Badge variant="outline" className="text-xs px-1">
                  {note.noteName}
                </Badge>
                <span className="text-muted-foreground">
                  Beat {note.beatNumber}.{(note.subdivision * 4).toFixed(0)}
                </span>
                <span className="text-muted-foreground">
                  ({note.offsetMs > 0 ? '+' : ''}{note.offsetMs.toFixed(0)}ms)
                </span>
                <Badge 
                  variant={
                    note.accuracy === 'perfect' ? 'default' :
                    note.accuracy === 'good' ? 'secondary' :
                    'outline'
                  }
                  className="text-xs px-1"
                >
                  {note.accuracy}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic p-2">
            No notes played yet this turn
          </div>
        )}
      </div>

      {/* Lick Recognition Hints */}
      {gameState === "player-turn" && recordedNotes.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">
            Lick Matching Status:
          </div>
          <div className="space-y-1 text-xs">
            {licks.slice(0, 3).map((lick) => (
              <div key={lick.id} className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {lick.name}:
                </span>
                <span className="text-muted-foreground">
                  {recordedNotes.length < lick.notes.length 
                    ? `Need ${lick.notes.length - recordedNotes.length} more notes`
                    : 'Checking...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
