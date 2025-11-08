import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { RecordedNote } from "@/types/recording";

interface RealTimeNotesDisplayProps {
  notes: RecordedNote[];
  isRecording: boolean;
  currentBeat: number;
  gameState?: string;
}

const accuracyColors = {
  perfect: "bg-green-500",
  good: "bg-yellow-500",
  ok: "bg-orange-500",
  poor: "bg-red-500"
};

export const RealTimeNotesDisplay = ({
  notes,
  isRecording,
  currentBeat,
  gameState
}: RealTimeNotesDisplayProps) => {
  const isGameOver = gameState === "game-over";
  const playerTurnBars = [2, 4, 6, 8];
  
  // Default to first turn, or current turn if in battle
  const [selectedTurn, setSelectedTurn] = useState(1);

  // Filter notes by selected bar (turn 1 = bar 2, turn 2 = bar 4, etc.)
  const selectedBar = playerTurnBars[selectedTurn - 1];
  const turnNotes = isGameOver 
    ? notes.filter(note => note.barNumber === selectedBar)
    : notes.slice(-8); // During battle, show last 8 notes

  // Count notes per turn for the selector
  const notesPerTurn = playerTurnBars.map(bar => 
    notes.filter(note => note.barNumber === bar).length
  );

  return (
    <Card className="p-4 bg-card/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          {isGameOver ? `Turn ${selectedTurn} Notes` : 'Real-time Notes'}
        </h3>
        {isRecording && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Recording</span>
          </div>
        )}
      </div>

      {/* Turn Selector - only show in game-over state */}
      {isGameOver && (
        <div className="flex gap-2 mb-3">
          {playerTurnBars.map((bar, idx) => {
            const turnNum = idx + 1;
            const noteCount = notesPerTurn[idx];
            return (
              <Button
                key={bar}
                variant={selectedTurn === turnNum ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTurn(turnNum)}
                className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
              >
                <span className="text-xs font-semibold">Turn {turnNum}</span>
                <span className="text-xs opacity-70">{noteCount} notes</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Visual beat indicator - only during active battle */}
      {!isGameOver && (
        <div className="flex gap-1 mb-3">
          {[1, 2, 3, 4].map((beat) => (
            <div
              key={beat}
              className={`flex-1 h-2 rounded transition-all ${
                currentBeat === beat
                  ? 'bg-primary'
                  : 'bg-border'
              }`}
            />
          ))}
        </div>
      )}

      {/* Notes display */}
      {turnNotes.length > 0 ? (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {turnNotes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs animate-fade-in"
            >
              {/* Accuracy dot */}
              <div
                className={`w-2 h-2 rounded-full ${accuracyColors[note.accuracy]}`}
              />
              
              {/* Note name */}
              <span className="font-mono font-bold min-w-[40px]">
                {note.noteName}
              </span>
              
              {/* Beat position */}
              <span className="text-muted-foreground min-w-[60px]">
                B{note.beatNumber}.{(note.subdivision * 4).toFixed(0)}
              </span>
              
              {/* Timing offset */}
              <span
                className={`font-mono text-xs ${
                  Math.abs(note.offsetMs) < 20
                    ? 'text-green-500'
                    : Math.abs(note.offsetMs) < 50
                    ? 'text-yellow-500'
                    : 'text-red-500'
                }`}
              >
                {note.offsetMs > 0 ? '+' : ''}
                {note.offsetMs.toFixed(0)}ms
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">
          {isGameOver 
            ? 'No notes played in this turn'
            : isRecording 
            ? 'Play some notes...' 
            : 'Start playing to see notes'}
        </div>
      )}

      {/* Legend */}
      {turnNotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Perfect</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">OK</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Poor</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};