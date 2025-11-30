import { useState, useEffect, useRef } from 'react';
import { Plus, Play, Pause, Square } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useMultiTrack } from '@/hooks/useMultiTrack';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrack } from './TimelineTrack';
import { RecordedNote } from '@/types/recording';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface MultiTrackTimelineProps {
  onPlaySound?: (soundId: string, noteName: string) => void;
  currentBpm: number;
  isMetronomeActive: boolean;
  recordedNotes: RecordedNote[];
  onClearRecording: () => void;
}

export const MultiTrackTimeline = ({
  onPlaySound,
  currentBpm,
  isMetronomeActive,
  recordedNotes,
  onClearRecording,
}: MultiTrackTimelineProps) => {
  const {
    tracks,
    recordings,
    selectedTrackId,
    setSelectedTrackId,
    isLoading,
    addTrack,
    updateTrack,
    deleteTrack,
    addRecording,
    deleteRecording,
    getRecordingsForTrack,
  } = useMultiTrack();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60); // Default 60 seconds
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50);
  const [recordArmedTrackId, setRecordArmedTrackId] = useState<string | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Calculate total duration based on recordings
  useEffect(() => {
    const maxDuration = recordings.reduce((max, rec) => {
      return Math.max(max, rec.start_time + rec.duration);
    }, 60);
    setDuration(Math.max(60, maxDuration + 10));
  }, [recordings]);

  // Playback loop
  useEffect(() => {
    if (isPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.05;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 50);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Handle recording
  useEffect(() => {
    if (isMetronomeActive && recordArmedTrackId && recordedNotes.length > 0) {
      if (recordingStartTimeRef.current === null) {
        recordingStartTimeRef.current = currentTime;
      }
    } else if (!isMetronomeActive && recordingStartTimeRef.current !== null && recordedNotes.length > 0) {
      // Save recording when metronome stops
      const startTime = recordingStartTimeRef.current;
      const lastNote = recordedNotes[recordedNotes.length - 1];
      const durationInSeconds = (lastNote.timestamp - recordedNotes[0].timestamp) / 1000;

      addRecording(
        recordArmedTrackId!,
        recordedNotes,
        startTime,
        durationInSeconds,
        currentBpm,
        'straight'
      );

      recordingStartTimeRef.current = null;
      onClearRecording();
    }
  }, [isMetronomeActive, recordArmedTrackId, recordedNotes, currentTime, currentBpm, addRecording, onClearRecording]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAddTrack = async (instrumentType: 'piano' | 'drums' | 'synth' | 'organ' | 'guitar') => {
    const newTrack = await addTrack(instrumentType);
    if (newTrack) {
      setSelectedTrackId(newTrack.id);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading timeline...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Multi-Track Timeline</h2>
        
        <div className="flex items-center gap-2">
          {/* Transport Controls */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlay}
            disabled={isPlaying}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePause}
            disabled={!isPlaying}
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleStop}
          >
            <Square className="w-4 h-4" />
          </Button>

          {/* Add Track */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default">
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddTrack('piano')}>
                Piano Track
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTrack('drums')}>
                Drums Track
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTrack('synth')}>
                Synth Track
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTrack('organ')}>
                Organ Track
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddTrack('guitar')}>
                Guitar Track
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Timeline Ruler */}
      <TimelineRuler
        duration={duration}
        pixelsPerSecond={pixelsPerSecond}
        currentTime={currentTime}
      />

      {/* Tracks */}
      <div className="space-y-0 border border-border rounded-lg overflow-hidden">
        {tracks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No tracks yet. Click "Add Track" to get started!
          </div>
        ) : (
          tracks.map((track) => (
            <TimelineTrack
              key={track.id}
              track={track}
              recordings={getRecordingsForTrack(track.id)}
              duration={duration}
              pixelsPerSecond={pixelsPerSecond}
              onUpdateTrack={(updates) => updateTrack(track.id, updates)}
              onDeleteTrack={() => deleteTrack(track.id)}
              onDeleteRecording={deleteRecording}
              isRecordArmed={recordArmedTrackId === track.id}
              onRecordArmToggle={() => {
                setRecordArmedTrackId(recordArmedTrackId === track.id ? null : track.id);
              }}
              isSelected={selectedTrackId === track.id}
              onSelect={() => setSelectedTrackId(track.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
};
