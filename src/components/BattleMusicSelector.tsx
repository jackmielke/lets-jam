import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

interface MusicMetadata {
  id: string;
  file_name: string;
  title: string;
  original_bpm: number;
  musical_key: string | null;
  cue_point_seconds: number;
  duration_seconds: number | null;
}

interface MusicFile {
  name: string;
  path: string;
  url: string;
}

interface BattleMusicSelectorProps {
  battleBPM: number;
  onSelectMusic: (metadata: MusicMetadata, url: string) => void;
  selectedFileName: string | null;
}

export const BattleMusicSelector: React.FC<BattleMusicSelectorProps> = ({
  battleBPM,
  onSelectMusic,
  selectedFileName
}) => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [metadata, setMetadata] = useState<MusicMetadata[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');

  useEffect(() => {
    loadMusicAndMetadata();
  }, []);

  const loadMusicAndMetadata = async () => {
    try {
      // Load files from storage
      const { data: files, error: filesError } = await supabase.storage
        .from('background-music')
        .list();

      if (filesError) throw filesError;

      if (files) {
        const filesWithUrls: MusicFile[] = await Promise.all(
          files.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from('background-music')
              .getPublicUrl(file.name);

            return {
              name: file.name,
              path: file.name,
              url: urlData.publicUrl
            };
          })
        );
        setMusicFiles(filesWithUrls);
      }

      // Load metadata
      const { data: metadataData, error: metadataError } = await supabase
        .from('background_music_metadata')
        .select('*');

      if (metadataError) throw metadataError;

      if (metadataData) {
        setMetadata(
          metadataData.map(m => ({
            ...m,
            original_bpm: Number(m.original_bpm),
            cue_point_seconds: Number(m.cue_point_seconds),
            duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null
          }))
        );
      }
    } catch (error) {
      console.error('Error loading music:', error);
    }
  };

  const handleSelectFile = (fileName: string) => {
    setSelectedFile(fileName);
    const meta = metadata.find(m => m.file_name === fileName);
    const file = musicFiles.find(f => f.name === fileName);

    if (meta && file) {
      onSelectMusic(meta, file.url);
    }
  };

  const getPlaybackInfo = (fileName: string) => {
    const meta = metadata.find(m => m.file_name === fileName);
    if (!meta) return null;

    const playbackRate = battleBPM / meta.original_bpm;
    const playbackPercentage = Math.round(playbackRate * 100);

    return {
      meta,
      playbackRate,
      playbackPercentage,
      tooFast: playbackRate > 2,
      tooSlow: playbackRate < 0.5
    };
  };

  // Filter files that have metadata
  const filesWithMetadata = musicFiles.filter(f =>
    metadata.some(m => m.file_name === f.name)
  );

  const currentInfo = selectedFile ? getPlaybackInfo(selectedFile) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Battle Music
        </CardTitle>
        <CardDescription>
          Select background music that will sync to {battleBPM} BPM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedFile} onValueChange={handleSelectFile}>
          <SelectTrigger>
            <SelectValue placeholder="Select a track" />
          </SelectTrigger>
          <SelectContent>
            {filesWithMetadata.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No tracks with metadata available.<br />
                Upload music and set metadata first.
              </div>
            ) : (
              filesWithMetadata.map((file) => {
                const info = getPlaybackInfo(file.name);
                const meta = metadata.find(m => m.file_name === file.name);
                return (
                  <SelectItem key={file.name} value={file.name}>
                    {meta?.title || file.name}
                    {meta && ` (${meta.original_bpm} BPM${meta.musical_key ? ', ' + meta.musical_key : ''})`}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>

        {currentInfo && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original BPM:</span>
              <span className="font-medium">{currentInfo.meta.original_bpm}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battle BPM:</span>
              <span className="font-medium">{battleBPM}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Playback Speed:</span>
              <span className={`font-medium ${currentInfo.tooFast || currentInfo.tooSlow ? 'text-destructive' : 'text-primary'}`}>
                {currentInfo.playbackPercentage}%
              </span>
            </div>
            {currentInfo.meta.musical_key && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Key:</span>
                <span className="font-medium">{currentInfo.meta.musical_key}</span>
              </div>
            )}
            {(currentInfo.tooFast || currentInfo.tooSlow) && (
              <p className="text-xs text-destructive">
                ⚠️ Playback speed is {currentInfo.tooFast ? 'too fast' : 'too slow'} for good quality
              </p>
            )}
          </div>
        )}

        {filesWithMetadata.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Upload background music and set metadata to enable synchronized playback during battles.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
