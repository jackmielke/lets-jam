import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface MusicFile {
  name: string;
  path: string;
  url: string;
}

interface MusicMetadata {
  id: string;
  file_name: string;
  title: string;
  original_bpm: number;
  musical_key: string | null;
  cue_point_seconds: number;
  duration_seconds: number | null;
}

interface MusicMetadataEditorProps {
  musicFiles: MusicFile[];
  onSaved?: () => void;
}

export const MusicMetadataEditor: React.FC<MusicMetadataEditorProps> = ({ musicFiles, onSaved }) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>(musicFiles[0]?.name || '');
  const [metadata, setMetadata] = useState<Partial<MusicMetadata>>({
    file_name: musicFiles[0]?.name || '',
    title: musicFiles[0]?.name.replace(/\.[^/.]+$/, '') || '', // Remove file extension
    original_bpm: 120,
    musical_key: '',
    cue_point_seconds: 0,
    duration_seconds: null
  });
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedMusicFile = musicFiles.find(f => f.name === selectedFileName);

  useEffect(() => {
    loadMetadata();
  }, [selectedFileName]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        setMetadata(prev => ({
          ...prev,
          duration_seconds: audio.duration
        }));
      };
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    }
  }, []);

  const loadMetadata = async () => {
    if (!selectedFileName) return;
    
    const { data, error } = await supabase
      .from('background_music_metadata')
      .select('*')
      .eq('file_name', selectedFileName)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading metadata:', error);
      return;
    }

    if (data) {
      setMetadata({
        ...data,
        original_bpm: Number(data.original_bpm),
        cue_point_seconds: Number(data.cue_point_seconds),
        duration_seconds: data.duration_seconds ? Number(data.duration_seconds) : null
      });
    } else {
      // Reset to defaults if no metadata exists
      setMetadata({
        file_name: selectedFileName,
        title: selectedFileName.replace(/\.[^/.]+$/, ''),
        original_bpm: 120,
        musical_key: '',
        cue_point_seconds: 0,
        duration_seconds: null
      });
    }
  };

  const handleFileChange = (fileName: string) => {
    // Pause current playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setSelectedFileName(fileName);
  };

  const handleSave = async () => {
    if (!metadata.title || !metadata.original_bpm) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and original BPM",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('background_music_metadata')
      .upsert({
        file_name: selectedFileName,
        title: metadata.title,
        original_bpm: metadata.original_bpm,
        musical_key: metadata.musical_key || null,
        cue_point_seconds: metadata.cue_point_seconds || 0,
        duration_seconds: metadata.duration_seconds || null
      }, { onConflict: 'file_name' });

    if (error) {
      console.error('Error saving metadata:', error);
      toast({
        title: "Error",
        description: "Failed to save metadata",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Saved",
      description: "Music metadata saved successfully"
    });
    onSaved?.();
  };

  const handleSetCuePoint = () => {
    if (audioRef.current) {
      setMetadata(prev => ({
        ...prev,
        cue_point_seconds: audioRef.current!.currentTime
      }));
      toast({
        title: "Cue point set",
        description: `Set to ${audioRef.current.currentTime.toFixed(2)}s`
      });
    }
  };

  const handleSeekToCuePoint = () => {
    if (audioRef.current && metadata.cue_point_seconds !== undefined) {
      audioRef.current.currentTime = metadata.cue_point_seconds;
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (musicFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Music Metadata</CardTitle>
          <CardDescription>
            No music files uploaded yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Music Metadata</CardTitle>
        <CardDescription>
          Set BPM, key, and cue point for battle synchronization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="track-select">Select Track</Label>
          <Select value={selectedFileName} onValueChange={handleFileChange}>
            <SelectTrigger id="track-select">
              <SelectValue placeholder="Select a track" />
            </SelectTrigger>
            <SelectContent>
              {musicFiles.map((file) => (
                <SelectItem key={file.name} value={file.name}>
                  {file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Track Title</Label>
          <Input
            id="title"
            value={metadata.title || ''}
            onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter track title"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bpm">Original BPM</Label>
            <Input
              id="bpm"
              type="number"
              min="1"
              max="300"
              value={metadata.original_bpm || ''}
              onChange={(e) => setMetadata(prev => ({ ...prev, original_bpm: Number(e.target.value) }))}
              placeholder="120"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="key">Musical Key</Label>
            <Input
              id="key"
              value={metadata.musical_key || ''}
              onChange={(e) => setMetadata(prev => ({ ...prev, musical_key: e.target.value }))}
              placeholder="C, Am, F#, etc."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cue Point (seconds)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              min="0"
              value={metadata.cue_point_seconds || 0}
              onChange={(e) => setMetadata(prev => ({ ...prev, cue_point_seconds: Number(e.target.value) }))}
            />
            <Button onClick={handleSetCuePoint} variant="outline">
              Set Current Time
            </Button>
            <Button onClick={handleSeekToCuePoint} variant="outline">
              Jump to Cue
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview Audio</Label>
          <div className="flex gap-2">
            <Button onClick={togglePlayback} variant="outline" className="flex-1">
              {isPlaying ? 'Pause' : 'Play'} Preview
            </Button>
          </div>
          <audio
            ref={audioRef}
            src={selectedMusicFile?.url}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        </div>

        {metadata.duration_seconds && (
          <p className="text-sm text-muted-foreground">
            Duration: {metadata.duration_seconds.toFixed(1)}s
          </p>
        )}

        <Button onClick={handleSave} className="w-full">
          Save Metadata
        </Button>
      </CardContent>
    </Card>
  );
};
