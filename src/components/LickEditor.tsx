import { RecordedNote } from "@/types/recording";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit3, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface LickEditorProps {
  notes: RecordedNote[];
  onUpdateNote: (index: number, beatNumber: number, subdivision: number) => void;
  beatsPerBar?: number;
  isEditing?: boolean;
  onSave?: () => void;
  canSave?: boolean;
}

const subdivisions = [0, 0.25, 0.5, 0.75];

export const LickEditor = ({ notes, onUpdateNote, beatsPerBar = 4, isEditing = false, onSave, canSave = true }: LickEditorProps) => {
  const [draggedNoteIndex, setDraggedNoteIndex] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const hasNotes = notes.length > 0;

  // Find the beat range
  const maxBeat = hasNotes ? Math.max(...notes.map(n => n.beatNumber), beatsPerBar) : beatsPerBar;
  const beats = Array.from({ length: maxBeat }, (_, i) => i + 1);

  const handleDragStart = (index: number) => {
    setDraggedNoteIndex(index);
  };

  const handleDrop = (beat: number, subdivision: number) => {
    if (draggedNoteIndex !== null) {
      onUpdateNote(draggedNoteIndex, beat, subdivision);
      setDraggedNoteIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Lick Editor</h3>
          <span className="text-sm text-muted-foreground">
            {isCollapsed 
              ? (hasNotes ? `${notes.length} notes` : "No notes recorded") 
              : (hasNotes ? "Drag notes to adjust timing" : "Record some notes to edit")}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="gap-2"
        >
          {isCollapsed ? (
            <>
              <span className="text-sm">Expand</span>
              <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              <span className="text-sm">Collapse</span>
              <ChevronUp className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          {!hasNotes ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Start the metronome and play some keys to record notes.</p>
              <p className="text-sm mt-2">Or click "Edit" on a saved lick to modify it.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header with beat numbers */}
          <div className="flex border-b border-border mb-2 pb-2">
            <div className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">
              Note
            </div>
            {beats.map(beat => (
              <div key={beat} className="flex-1 min-w-[100px]">
                <div className="text-center text-sm font-semibold text-foreground">
                  Beat {beat}
                </div>
                <div className="flex">
                  {subdivisions.map(sub => (
                    <div
                      key={sub}
                      className="flex-1 text-center text-[10px] text-muted-foreground"
                    >
                      {sub === 0 ? "•" : sub === 0.5 ? "+" : "·"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Grid with notes */}
          {notes.map((note, noteIndex) => (
            <div key={noteIndex} className="flex items-center border-b border-border/50 py-2">
              <div
                className="w-20 shrink-0 text-xs font-semibold truncate pr-2"
                draggable
                onDragStart={() => handleDragStart(noteIndex)}
                style={{ cursor: 'grab' }}
              >
                {note.noteName}
              </div>
              {beats.map(beat => (
                <div key={beat} className="flex-1 min-w-[100px] flex">
                  {subdivisions.map(sub => {
                    const isNoteHere = note.beatNumber === beat && note.subdivision === sub;
                    return (
                      <div
                        key={sub}
                        className={`
                          flex-1 h-10 border-l border-border/30 flex items-center justify-center
                          transition-colors
                          ${sub === 0 ? "border-l-border" : ""}
                          ${isNoteHere ? "" : "hover:bg-muted/30"}
                        `}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(beat, sub)}
                      >
                        {isNoteHere && (
                          <div
                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={() => handleDragStart(noteIndex)}
                          >
                            {note.noteName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}

          {/* Legend */}
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
            <div>• = On beat</div>
            <div>+ = 8th note</div>
            <div>· = 16th note</div>
          </div>
        </div>
      </div>
          )}

        {/* Update button for editing mode */}
        {isEditing && onSave && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={onSave}
              disabled={!canSave}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              Update Lick
            </Button>
          </div>
        )}
        </>
      )}
    </Card>
  );
};
