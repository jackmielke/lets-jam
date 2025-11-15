import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, SkipBack } from "lucide-react";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/integrations/supabase/client";

interface MusicFile {
  name: string;
  path: string;
  url: string;
  title?: string;
}

interface SimpleDJPlayerProps {
  audioUrl?: string;
  trackName?: string;
  onTrackSelect?: (url: string, title: string) => void;
}

export const SimpleDJPlayer = ({ audioUrl: initialAudioUrl, trackName: initialTrackName, onTrackSelect }: SimpleDJPlayerProps) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [tempo, setTempo] = useState([100]);
  const [eqLow, setEqLow] = useState([50]);
  const [eqMid, setEqMid] = useState([50]);
  const [eqHigh, setEqHigh] = useState([50]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([]);
  const [selectedTrackUrl, setSelectedTrackUrl] = useState<string>(initialAudioUrl || "");
  const [selectedTrackName, setSelectedTrackName] = useState<string>(initialTrackName || "");

  // Load available music files
  useEffect(() => {
    loadMusicFiles();
  }, []);

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

  const handleTrackSelect = (url: string) => {
    const selectedFile = musicFiles.find(f => f.url === url);
    if (selectedFile) {
      setSelectedTrackUrl(url);
      setSelectedTrackName(selectedFile.title || selectedFile.name);
      setIsPlaying(false);
      if (onTrackSelect) {
        onTrackSelect(url, selectedFile.title || selectedFile.name);
      }
    }
  };

  const audioUrl = selectedTrackUrl || initialAudioUrl;
  const trackName = selectedTrackName || initialTrackName;

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "hsl(var(--muted-foreground) / 0.3)",
      progressColor: "hsl(var(--primary))",
      cursorColor: "hsl(var(--primary))",
      barWidth: 2,
      barRadius: 3,
      cursorWidth: 2,
      height: 120,
      barGap: 2,
    });

    wavesurferRef.current = wavesurfer;

    wavesurfer.on("ready", () => {
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on("audioprocess", () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });

    wavesurfer.on("play", () => {
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      setIsPlaying(false);
    });

    return () => {
      wavesurfer.destroy();
    };
  }, []);

  // Load audio URL
  useEffect(() => {
    if (audioUrl && wavesurferRef.current) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  // Update volume
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(volume[0] / 100);
    }
  }, [volume]);

  // Update playback rate (tempo)
  useEffect(() => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(tempo[0] / 100);
    }
  }, [tempo]);

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    
    if (!audioUrl) {
      toast.error("Please select a track first");
      return;
    }

    wavesurferRef.current.playPause();
  };

  const handleRestart = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.seekTo(0);
    toast.success("Track restarted");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Track Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Select Track</Label>
        <Select value={selectedTrackUrl} onValueChange={handleTrackSelect}>
          <SelectTrigger className="w-full bg-background">
            <SelectValue placeholder="Choose a track to play..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {musicFiles.map((file) => (
              <SelectItem key={file.url} value={file.url}>
                {file.title || file.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track Info */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary mb-1">
          {trackName || "No Track Selected"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentTime > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "Select a track to begin"}
        </p>
      </div>

      {/* Waveform Visualization */}
      <div className="rounded-lg overflow-hidden bg-muted/20 p-4 border border-primary/20">
        <div ref={waveformRef} />
      </div>

      {/* Transport Controls */}
      <div className="flex justify-center items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleRestart}
          disabled={!audioUrl}
          className="h-12 w-12"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          onClick={handlePlayPause}
          disabled={!audioUrl}
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:brightness-110 shadow-lg"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8 ml-1" />
          )}
        </Button>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Master Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Master Controls
          </h4>
          
          {/* Volume */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Volume</Label>
              <span className="text-xs font-mono text-primary">{volume[0]}%</span>
            </div>
            <Slider
              value={volume}
              onValueChange={setVolume}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Tempo</Label>
              <span className="text-xs font-mono text-primary">{tempo[0]}%</span>
            </div>
            <Slider
              value={tempo}
              onValueChange={setTempo}
              min={25}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* EQ Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Equalizer
          </h4>
          
          {/* Low EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Low</Label>
              <span className="text-xs font-mono text-primary">{eqLow[0]}%</span>
            </div>
            <Slider
              value={eqLow}
              onValueChange={setEqLow}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Mid EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Mid</Label>
              <span className="text-xs font-mono text-primary">{eqMid[0]}%</span>
            </div>
            <Slider
              value={eqMid}
              onValueChange={setEqMid}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* High EQ */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">High</Label>
              <span className="text-xs font-mono text-primary">{eqHigh[0]}%</span>
            </div>
            <Slider
              value={eqHigh}
              onValueChange={setEqHigh}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
