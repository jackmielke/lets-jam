import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Sample {
  id: string;
  title: string;
  file_path: string;
  duration_seconds: number;
  created_at: string;
}

interface SampleLibraryProps {
  refreshTrigger: number;
}

export const SampleLibrary = ({ refreshTrigger }: SampleLibraryProps) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const loadSamples = async () => {
    try {
      const { data, error } = await supabase
        .from("audio_samples")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSamples(data || []);
    } catch (error) {
      console.error("Error loading samples:", error);
      toast.error("Failed to load samples");
    }
  };

  useEffect(() => {
    loadSamples();
  }, [refreshTrigger]);

  const playSample = async (sample: Sample) => {
    try {
      // Stop current audio if playing
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }

      if (playingSampleId === sample.id) {
        setPlayingSampleId(null);
        return;
      }

      const { data } = supabase.storage
        .from("audio-samples")
        .getPublicUrl(sample.file_path);

      const audio = new Audio(data.publicUrl);
      audio.onended = () => setPlayingSampleId(null);
      
      setAudioElement(audio);
      await audio.play();
      setPlayingSampleId(sample.id);
    } catch (error) {
      console.error("Error playing sample:", error);
      toast.error("Failed to play sample");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (samples.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          No samples yet. Record your first sample above!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-lg font-semibold">Sample Library</h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {samples.map((sample) => (
          <div
            key={sample.id}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{sample.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDuration(sample.duration_seconds)} • {new Date(sample.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => playSample(sample)}
            >
              {playingSampleId === sample.id ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};
