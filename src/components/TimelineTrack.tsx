import { Track, TrackRecording } from '@/types/track';
import { TrackControls } from './TrackControls';

interface TimelineTrackProps {
  track: Track;
  recordings: TrackRecording[];
  duration: number;
  pixelsPerSecond: number;
  onUpdateTrack: (updates: Partial<Track>) => void;
  onDeleteTrack: () => void;
  onDeleteRecording: (recordingId: string) => void;
  isRecordArmed: boolean;
  onRecordArmToggle: () => void;
  isSelected: boolean;
  onSelect: () => void;
}

export const TimelineTrack = ({
  track,
  recordings,
  duration,
  pixelsPerSecond,
  onUpdateTrack,
  onDeleteTrack,
  onDeleteRecording,
  isRecordArmed,
  onRecordArmToggle,
  isSelected,
  onSelect,
}: TimelineTrackProps) => {
  return (
    <div 
      className={`flex border-b border-border ${isSelected ? 'bg-accent/10' : ''}`}
      onClick={onSelect}
    >
      <TrackControls
        track={track}
        onUpdate={onUpdateTrack}
        onDelete={onDeleteTrack}
        isRecordArmed={isRecordArmed}
        onRecordArmToggle={onRecordArmToggle}
      />

      <div 
        className="relative flex-1 h-24 bg-background overflow-x-auto"
        style={{ width: duration * pixelsPerSecond }}
      >
        {/* Render recordings as blocks */}
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="absolute top-2 bottom-2 rounded bg-primary/20 border border-primary/40 hover:bg-primary/30 cursor-pointer transition-colors"
            style={{
              left: recording.start_time * pixelsPerSecond,
              width: recording.duration * pixelsPerSecond,
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Future: Open recording editor
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDeleteRecording(recording.id);
            }}
          >
            {/* Waveform visualization (simplified) */}
            <div className="h-full flex items-center px-2">
              <div className="flex gap-[1px] h-full items-center">
                {recording.notes.slice(0, 50).map((note, i) => (
                  <div
                    key={i}
                    className="w-[2px] bg-primary"
                    style={{
                      height: `${Math.random() * 60 + 20}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Grid lines */}
        {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-[1px] bg-border/30"
            style={{ left: i * pixelsPerSecond }}
          />
        ))}
      </div>
    </div>
  );
};
