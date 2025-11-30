import { Volume2, Headphones, Mic, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Track } from '@/types/track';

interface TrackControlsProps {
  track: Track;
  onUpdate: (updates: Partial<Track>) => void;
  onDelete: () => void;
  isRecordArmed: boolean;
  onRecordArmToggle: () => void;
}

export const TrackControls = ({
  track,
  onUpdate,
  onDelete,
  isRecordArmed,
  onRecordArmToggle,
}: TrackControlsProps) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border-r border-border w-64">
      {/* Track Color */}
      <div
        className="w-1 h-full rounded"
        style={{ backgroundColor: track.color }}
      />

      {/* Track Name */}
      <Input
        value={track.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="h-8 text-sm"
      />

      {/* Volume Control */}
      <div className="flex items-center gap-1 w-24">
        <Volume2 className="w-3 h-3 text-muted-foreground" />
        <Slider
          value={[track.volume * 100]}
          onValueChange={([v]) => onUpdate({ volume: v / 100 })}
          max={100}
          step={1}
          className="flex-1"
        />
      </div>

      {/* Mute */}
      <Button
        variant={track.is_muted ? 'default' : 'outline'}
        size="icon"
        className="h-8 w-8"
        onClick={() => onUpdate({ is_muted: !track.is_muted })}
      >
        <Volume2 className="w-3 h-3" />
      </Button>

      {/* Solo */}
      <Button
        variant={track.is_soloed ? 'default' : 'outline'}
        size="icon"
        className="h-8 w-8"
        onClick={() => onUpdate({ is_soloed: !track.is_soloed })}
      >
        <Headphones className="w-3 h-3" />
      </Button>

      {/* Record Arm */}
      <Button
        variant={isRecordArmed ? 'destructive' : 'outline'}
        size="icon"
        className="h-8 w-8"
        onClick={onRecordArmToggle}
      >
        <Mic className="w-3 h-3" />
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={onDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};
