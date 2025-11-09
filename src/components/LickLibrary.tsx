import { Lick } from "@/types/lick";
import { Card } from "@/components/ui/card";
import { Music, Trash2, Play, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";

interface LickLibraryProps {
  licks: Lick[];
  onDelete: (lickId: string) => void;
  onDemonstrate: (lick: Lick) => void;
  onEdit: (lick: Lick) => void;
  onUpdateDifficulty: (lickId: string, difficulty: number) => void;
  editingLickId?: string | null;
}

export const LickLibrary = ({ licks, onDelete, onDemonstrate, onEdit, onUpdateDifficulty, editingLickId }: LickLibraryProps) => {
  const [filter, setFilter] = useState<"all" | "straight" | "swing">("all");
  
  const straightLicks = licks.filter(l => l.timingType === 'straight').length;
  const swingLicks = licks.filter(l => l.timingType === 'swing').length;
  
  const filteredLicks = licks.filter(lick => {
    if (filter === "all") return true;
    return lick.timingType === filter;
  });
  
  return (
    <Card className="p-6">
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-semibold">Lick Library ({licks.length}/10)</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {straightLicks}/5 Straight • {swingLicks}/5 Swing
        </p>
        
        {licks.length > 0 && (
          <ToggleGroup type="single" value={filter} onValueChange={(value) => value && setFilter(value as "all" | "straight" | "swing")}>
            <ToggleGroupItem value="all" aria-label="Show all licks" className="text-xs">
              All ({licks.length})
            </ToggleGroupItem>
            <ToggleGroupItem value="straight" aria-label="Show straight licks" className="text-xs">
              ♪ Straight ({straightLicks})
            </ToggleGroupItem>
            <ToggleGroupItem value="swing" aria-label="Show swing licks" className="text-xs">
              ³ Swing ({swingLicks})
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
      
      {licks.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No licks saved yet. Start the metronome and play a lick, then click "Save as Lick" to add it to your library.
        </p>
      ) : filteredLicks.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No {filter} licks in your library yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filteredLicks.map((lick) => {
            const isEditing = editingLickId === lick.id;
            return (
              <div
                key={lick.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isEditing ? "bg-primary/10 border-2 border-primary" : "bg-muted/50"
                }`}
              >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{lick.name}</div>
                  <Badge variant={lick.timingType === 'straight' ? 'default' : 'secondary'}>
                    {lick.timingType === 'straight' ? '♪ Straight' : '³ Swing'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {lick.notes.length} notes • {lick.bpm} BPM
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {lick.notes.map(n => n.noteName).join(" → ")}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Label htmlFor={`difficulty-${lick.id}`} className="text-xs text-muted-foreground whitespace-nowrap">
                    Difficulty:
                  </Label>
                  <Input
                    id={`difficulty-${lick.id}`}
                    type="number"
                    min="1"
                    max="100"
                    value={lick.difficulty || ""}
                    placeholder="1-100"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 100) {
                        onUpdateDifficulty(lick.id, val);
                      } else if (e.target.value === "") {
                        onUpdateDifficulty(lick.id, 0);
                      }
                    }}
                    className="w-20 h-7 text-sm"
                  />
                  {lick.difficulty && (
                    <span className="text-xs font-medium text-primary">
                      {lick.difficulty}/100
                    </span>
                  )}
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
                  onClick={() => onEdit(lick)}
                  className={isEditing ? "text-primary" : "hover:text-primary"}
                >
                  <Edit className="w-4 h-4" />
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
            );
          })}
        </div>
      )}
    </Card>
  );
};
