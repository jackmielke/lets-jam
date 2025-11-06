import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface MusicFile {
  name: string;
  path: string;
  url: string;
}

interface BackgroundMusicPlayerProps {
  refreshTrigger: number;
  metronomeBpm: number;
}

export const BackgroundMusicPlayer = ({ refreshTrigger, metronomeBpm }: BackgroundMusicPlayerProps) => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [referenceBpm, setReferenceBpm] = useState(120);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadMusicFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from("background-music").list();

      if (error) throw error;

      if (data) {
        const files: MusicFile[] = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from("background-music")
              .getPublicUrl(file.name);

            return {
              name: file.name,
              path: file.name,
              url: urlData.publicUrl,
            };
          })
        );
        setMusicFiles(files);
      }
    } catch (error) {
      console.error("Error loading music files:", error);
      toast.error("Failed to load music files");
    }
  };

  useEffect(() => {
    loadMusicFiles();
  }, [refreshTrigger]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && referenceBpm > 0) {
      audioRef.current.playbackRate = metronomeBpm / referenceBpm;
    }
  }, [metronomeBpm, referenceBpm]);

  const handlePlay = () => {
    if (!selectedFile) {
      toast.error("Please select a music file first");
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSelectFile = (filePath: string) => {
    setSelectedFile(filePath);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      const { error } = await supabase.storage.from("background-music").remove([filePath]);

      if (error) throw error;

      toast.success("Music file deleted");
      if (selectedFile === filePath) {
        setSelectedFile("");
        setIsPlaying(false);
      }
      loadMusicFiles();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete music file");
    }
  };

  const selectedFileObj = musicFiles.find((f) => f.path === selectedFile);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Select value={selectedFile} onValueChange={handleSelectFile}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select background music" />
            </SelectTrigger>
            <SelectContent>
              {musicFiles.map((file) => (
                <SelectItem key={file.path} value={file.path}>
                  {file.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedFile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleDelete(selectedFile)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlay}
              disabled={!selectedFile}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>

            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{volume[0]}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              Music BPM:
            </label>
            <input
              type="number"
              value={referenceBpm}
              onChange={(e) => setReferenceBpm(Number(e.target.value))}
              min={30}
              max={300}
              className="w-20 px-2 py-1 text-sm rounded-md border border-input bg-background"
            />
            <span className="text-xs text-muted-foreground">
              Speed: {((metronomeBpm / referenceBpm) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {selectedFileObj && (
          <audio
            ref={audioRef}
            src={selectedFileObj.url}
            loop
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>
    </Card>
  );
};
