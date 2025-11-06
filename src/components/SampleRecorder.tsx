import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Mic, Square, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SampleRecorderProps {
  onSampleSaved: () => void;
}

export const SampleRecorder = ({ onSampleSaved }: SampleRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const saveSample = async () => {
    if (!audioBlob || !title.trim()) {
      toast.error("Please provide a title for your sample");
      return;
    }

    setIsSaving(true);
    try {
      // Calculate duration
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve;
      });
      
      const duration = audio.duration;

      // Upload to storage
      const fileName = `${Date.now()}-${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("audio-samples")
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Save to database
      const { error: dbError } = await supabase
        .from("audio_samples")
        .insert({
          title: title.trim(),
          file_path: fileName,
          duration_seconds: duration,
        });

      if (dbError) throw dbError;

      toast.success("Sample saved successfully!");
      setTitle("");
      setAudioBlob(null);
      onSampleSaved();
    } catch (error) {
      console.error("Error saving sample:", error);
      toast.error("Failed to save sample");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Record Sample</h3>
      
      <div className="flex gap-2">
        {!isRecording && !audioBlob && (
          <Button onClick={startRecording} className="flex-1">
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        )}
        
        {isRecording && (
          <Button onClick={stopRecording} variant="destructive" className="flex-1">
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        )}
      </div>

      {audioBlob && (
        <div className="space-y-3">
          <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
          
          <Input
            type="text"
            placeholder="Sample title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Button
              onClick={saveSample}
              disabled={isSaving || !title.trim()}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Sample"}
            </Button>
            
            <Button
              onClick={() => setAudioBlob(null)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
