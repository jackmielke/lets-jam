import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Play, Pause, Volume2, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface MusicFile {
  name: string;
  path: string;
  url: string;
  title?: string;
  metadataId?: string;
}

interface BackgroundMusicPlayerProps {
  refreshTrigger: number;
  audioRef?: React.RefObject<HTMLAudioElement>;
  syncMode?: boolean;
  autoPlay?: boolean;
  onSelectFile?: (url: string) => void;
}

export const BackgroundMusicPlayer = ({ 
  refreshTrigger, 
  audioRef: externalAudioRef,
  syncMode = false,
  autoPlay = false,
  onSelectFile
}: BackgroundMusicPlayerProps) => {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [playbackRate, setPlaybackRate] = useState([100]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = externalAudioRef || internalAudioRef;

  const loadMusicFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from("background-music").list();

      if (error) throw error;

      // Load metadata
      const { data: metadataData } = await supabase
        .from("background_music_metadata")
        .select("*");

      if (data) {
        const files: MusicFile[] = await Promise.all(
          data.map(async (file) => {
            const { data: urlData } = supabase.storage
              .from("background-music")
              .getPublicUrl(file.name);

            // Find metadata for this file
            const metadata = metadataData?.find((m) => m.file_name === file.name);

            return {
              name: file.name,
              path: file.name,
              url: urlData.publicUrl,
              title: metadata?.title || file.name,
              metadataId: metadata?.id,
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
    if (audioRef.current) {
      // Convert percentage to rate (100% = 1.0)
      audioRef.current.playbackRate = playbackRate[0] / 100;
    }
  }, [playbackRate]);

  const handlePlay = () => {
    if (!selectedFile) {
      toast.error("Please select a music file first");
      return;
    }

    // In sync mode, don't allow manual play/pause
    if (syncMode) {
      toast.info("Music is controlled by battle sync");
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
    const fileObj = musicFiles.find((f) => f.path === filePath);
    if (fileObj && onSelectFile) {
      onSelectFile(fileObj.url);
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      // Delete metadata first
      const file = musicFiles.find((f) => f.path === filePath);
      if (file?.metadataId) {
        await supabase
          .from("background_music_metadata")
          .delete()
          .eq("file_name", filePath);
      }

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

  const startEditing = (file: MusicFile) => {
    setEditingId(file.path);
    setEditingTitle(file.title || file.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const saveTitle = async (file: MusicFile) => {
    try {
      if (file.metadataId) {
        // Update existing metadata
        const { error } = await supabase
          .from("background_music_metadata")
          .update({ title: editingTitle })
          .eq("id", file.metadataId);

        if (error) throw error;
      } else {
        // Create new metadata
        const { error } = await supabase
          .from("background_music_metadata")
          .insert({
            title: editingTitle,
            file_name: file.name,
            original_bpm: 120,
          });

        if (error) throw error;
      }

      toast.success("Title updated");
      setEditingId(null);
      setEditingTitle("");
      loadMusicFiles();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update title");
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
                  {file.title || file.name}
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

        {selectedFileObj && (
          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
            {editingId === selectedFileObj.path ? (
              <>
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-1"
                  placeholder="Track name"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => saveTitle(selectedFileObj)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancelEditing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium">{selectedFileObj.title || selectedFileObj.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(selectedFileObj)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        )}

        <div className="space-y-4">
          {!syncMode && (
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
          )}

          {syncMode && (
            <p className="text-sm text-muted-foreground text-center">
              🎵 Music synced to battle tempo
            </p>
          )}

          {!syncMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Speed:</span>
            <Slider
              value={playbackRate}
              onValueChange={setPlaybackRate}
              min={25}
              max={400}
              step={5}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">{playbackRate[0]}%</span>
          </div>
          )}
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
